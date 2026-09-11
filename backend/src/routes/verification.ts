import { Router } from 'express';
import { z } from 'zod';
import { Types } from 'mongoose';
import { requireAuth, requireRole, type AuthenticatedRequest } from '../middleware/auth.js';
import { Host } from '../models/Host.js';
import { Property } from '../models/Property.js';
import { OwnerVerification } from '../models/OwnerVerification.js';
import { PropertyVerification } from '../models/PropertyVerification.js';
import { PropertyVerificationDocument, type DocumentTypeEnum } from '../models/PropertyVerificationDocument.js';
import { verifyOwnerGovernmentId, verifyOwnerPAN } from '../services/verificationService.js';
import { savePrivateDocument, getPrivateDocumentStream, deletePrivateDocument } from '../services/storageService.js';

const router = Router();

// Express JSON body limit for base64 uploads
router.use(requireAuth);

/**
 * GET /api/verification/owner/status
 * Get owner identity verification status
 */
router.get('/owner/status', async (req: AuthenticatedRequest, res, next) => {
  try {
    const userId = req.auth?.userId;
    if (!userId) {
      res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
      return;
    }

    const host = await Host.findOne({ user: userId });
    if (!host) {
      res.json({
        success: true,
        data: {
          isHost: false,
          ownerVerification: null,
          mobileVerified: true,
          status: 'unverified',
        },
      });
      return;
    }

    let record = await OwnerVerification.findOne({ host: host._id });
    if (!record) {
      record = await OwnerVerification.create({
        host: host._id,
        user: userId,
        governmentIdStatus: 'unverified',
        panStatus: 'unverified',
        verificationStatus: 'unverified',
      });
    }

    res.json({
      success: true,
      data: {
        isHost: true,
        hostId: host._id,
        mobileVerified: true, // Phone authenticated / OTP verified
        governmentIdType: record.governmentIdType,
        governmentIdStatus: record.governmentIdStatus,
        panStatus: record.panStatus,
        panNumberMasked: record.panNumberMasked,
        panName: record.panName,
        verificationStatus: record.verificationStatus,
        verifiedAt: record.verifiedAt,
        failureReason: record.failureReason,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/verification/owner/identity
 * Submit Primary Government ID (Aadhaar / Passport / DL / Voter ID) verification
 * NEVER stores raw Aadhaar numbers or raw images in Hopebed database.
 */
router.post('/owner/identity', async (req: AuthenticatedRequest, res, next) => {
  try {
    const userId = req.auth?.userId;
    if (!userId) {
      res.status(401).json({ success: false, error: { message: 'Authentication required' } });
      return;
    }

    let host = await Host.findOne({ user: userId });
    if (!host) {
      // Auto register as host if not existing
      [host] = await Host.create([{ user: userId, verificationStatus: 'unverified', kycStatus: 'not_started' }]);
    }

    const input = z
      .object({
        idType: z.enum(['aadhaar', 'passport', 'driving_licence', 'voter_id']),
      })
      .parse(req.body);

    const record = await verifyOwnerGovernmentId({
      hostId: String(host._id),
      userId,
      idType: input.idType,
    });

    res.json({
      success: true,
      data: {
        message: 'Government identity verified successfully.',
        governmentIdType: record.governmentIdType,
        governmentIdStatus: record.governmentIdStatus,
        verificationStatus: record.verificationStatus,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/verification/owner/pan
 * Submit PAN verification
 */
router.post('/owner/pan', async (req: AuthenticatedRequest, res, next) => {
  try {
    const userId = req.auth?.userId;
    if (!userId) {
      res.status(401).json({ success: false, error: { message: 'Authentication required' } });
      return;
    }

    let host = await Host.findOne({ user: userId });
    if (!host) {
      [host] = await Host.create([{ user: userId, verificationStatus: 'unverified', kycStatus: 'not_started' }]);
    }

    const input = z
      .object({
        panNumber: z.string().trim().min(10).max(10),
        panName: z.string().trim().min(2).max(100),
      })
      .parse(req.body);

    const record = await verifyOwnerPAN({
      hostId: String(host._id),
      userId,
      panNumber: input.panNumber,
      panName: input.panName,
    });

    res.json({
      success: true,
      data: {
        message: 'PAN verified successfully.',
        panStatus: record.panStatus,
        panNumberMasked: record.panNumberMasked,
        panName: record.panName,
        verificationStatus: record.verificationStatus,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'INVALID_PAN_FORMAT') {
      res.status(400).json({ success: false, error: { code: 'INVALID_PAN_FORMAT', message: 'Please enter a valid 10-character PAN number (e.g. ABCDE1234F).' } });
      return;
    }
    next(error);
  }
});

/**
 * POST /api/verification/property/:propertyId/operator-mode
 * Declare whether owner or operator
 */
router.post('/property/:propertyId/operator-mode', async (req: AuthenticatedRequest, res, next) => {
  try {
    const userId = req.auth?.userId;
    const { propertyId } = req.params;

    const host = await Host.findOne({ user: userId });
    if (!host) {
      res.status(404).json({ success: false, error: { message: 'Host not found' } });
      return;
    }

    const property = await Property.findOne({ _id: propertyId, host: host._id });
    if (!property) {
      res.status(404).json({ success: false, error: { message: 'Property not found' } });
      return;
    }

    const input = z
      .object({
        isOwner: z.boolean(),
        operatorRole: z.enum(['owner', 'lease_holder', 'property_manager', 'authorized_operator']),
      })
      .parse(req.body);

    property.isOperator = !input.isOwner;
    property.operatorRole = input.operatorRole;
    await property.save();

    let verif = await PropertyVerification.findOne({ property: property._id });
    if (!verif) {
      verif = await PropertyVerification.create({
        property: property._id,
        host: host._id,
        isOwner: input.isOwner,
        operatorRole: input.operatorRole,
        status: 'draft',
      });
    } else {
      verif.isOwner = input.isOwner;
      verif.operatorRole = input.operatorRole;
      await verif.save();
    }

    res.json({ success: true, data: { propertyVerification: verif } });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/verification/property/:propertyId/documents
 * Secure document upload
 */
router.post('/property/:propertyId/documents', async (req: AuthenticatedRequest, res, next) => {
  try {
    const userId = req.auth?.userId;
    const { propertyId } = req.params;

    const host = await Host.findOne({ user: userId });
    if (!host) {
      res.status(404).json({ success: false, error: { message: 'Host not found' } });
      return;
    }

    const property = await Property.findOne({ _id: propertyId, host: host._id });
    if (!property) {
      res.status(404).json({ success: false, error: { message: 'Property not found' } });
      return;
    }

    const schema = z.object({
      documentType: z.enum([
        'ownership',
        'lease_agreement',
        'owner_authorization',
        'noc',
        'address_proof',
        'gst',
        'shop_establishment',
        'other',
      ]),
      originalFilename: z.string().min(1),
      mimeType: z.string().min(1),
      fileBase64: z.string().min(1), // Base64 encoded file string
    });

    const input = schema.parse(req.body);

    // Remove data URL prefix if present
    const base64Clean = input.fileBase64.replace(/^data:[^;]+;base64,/, '');
    const buffer = Buffer.from(base64Clean, 'base64');

    const saveResult = await savePrivateDocument({
      propertyId,
      documentType: input.documentType,
      originalFilename: input.originalFilename,
      mimeType: input.mimeType,
      buffer,
    });

    const doc = await PropertyVerificationDocument.create({
      property: property._id,
      documentType: input.documentType as DocumentTypeEnum,
      storageReference: saveResult.storageReference,
      originalFilename: input.originalFilename,
      mimeType: input.mimeType,
      fileSize: saveResult.fileSize,
      status: 'pending',
    });

    res.status(201).json({ success: true, data: { document: doc } });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'UNSUPPORTED_FILE_TYPE') {
        res.status(400).json({ success: false, error: { message: 'Only PDF, JPG, and PNG files are supported.' } });
        return;
      }
      if (error.message === 'FILE_TOO_LARGE') {
        res.status(400).json({ success: false, error: { message: 'Maximum file size allowed is 5 MB.' } });
        return;
      }
    }
    next(error);
  }
});

/**
 * GET /api/verification/property/:propertyId/documents
 * List uploaded documents for property
 */
router.get('/property/:propertyId/documents', async (req: AuthenticatedRequest, res, next) => {
  try {
    const userId = req.auth?.userId;
    const role = req.auth?.role;
    const { propertyId } = req.params;

    if (role !== 'admin') {
      const host = await Host.findOne({ user: userId });
      if (!host) {
        res.status(403).json({ success: false, error: { message: 'Access denied' } });
        return;
      }
      const property = await Property.findOne({ _id: propertyId, host: host._id });
      if (!property) {
        res.status(404).json({ success: false, error: { message: 'Property not found' } });
        return;
      }
    }

    const documents = await PropertyVerificationDocument.find({ property: propertyId }).sort({ createdAt: -1 });
    const propertyVerification = await PropertyVerification.findOne({ property: propertyId });

    res.json({
      success: true,
      data: {
        documents,
        propertyVerification,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/verification/property/:propertyId/documents/:docId
 * Remove property document
 */
router.delete('/property/:propertyId/documents/:docId', async (req: AuthenticatedRequest, res, next) => {
  try {
    const userId = req.auth?.userId;
    const { propertyId, docId } = req.params;

    const host = await Host.findOne({ user: userId });
    if (!host) {
      res.status(404).json({ success: false, error: { message: 'Host not found' } });
      return;
    }

    const property = await Property.findOne({ _id: propertyId, host: host._id });
    if (!property) {
      res.status(404).json({ success: false, error: { message: 'Property not found' } });
      return;
    }

    const doc = await PropertyVerificationDocument.findOne({ _id: docId, property: property._id });
    if (!doc) {
      res.status(404).json({ success: false, error: { message: 'Document not found' } });
      return;
    }

    await deletePrivateDocument(doc.storageReference);
    await PropertyVerificationDocument.deleteOne({ _id: doc._id });

    res.json({ success: true, data: { message: 'Document removed successfully' } });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/verification/documents/:docId/stream
 * Secure stream endpoint for owner or admin
 */
router.get('/documents/:docId/stream', async (req: AuthenticatedRequest, res, next) => {
  try {
    const userId = req.auth?.userId;
    const role = req.auth?.role;
    const { docId } = req.params;

    const doc = await PropertyVerificationDocument.findById(docId);
    if (!doc) {
      res.status(404).send('Document not found');
      return;
    }

    if (role !== 'admin') {
      const host = await Host.findOne({ user: userId });
      if (!host) {
        res.status(403).send('Unauthorized');
        return;
      }
      const property = await Property.findOne({ _id: doc.property, host: host._id });
      if (!property) {
        res.status(403).send('Unauthorized');
        return;
      }
    }

    const { stream, mimeType } = await getPrivateDocumentStream(doc.storageReference);
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(doc.originalFilename)}"`);
    stream.pipe(res);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/verification/property/:propertyId/submit
 * Submit property and owner verification for admin review
 */
router.post('/property/:propertyId/submit', async (req: AuthenticatedRequest, res, next) => {
  try {
    const userId = req.auth?.userId;
    const { propertyId } = req.params;

    const host = await Host.findOne({ user: userId });
    if (!host) {
      res.status(404).json({ success: false, error: { message: 'Host not found' } });
      return;
    }

    const property = await Property.findOne({ _id: propertyId, host: host._id });
    if (!property) {
      res.status(404).json({ success: false, error: { message: 'Property not found' } });
      return;
    }

    // Check owner identity status
    const ownerVerif = await OwnerVerification.findOne({ host: host._id });
    if (!ownerVerif || ownerVerif.governmentIdStatus !== 'verified' || ownerVerif.panStatus !== 'verified') {
      res.status(400).json({
        success: false,
        error: {
          code: 'IDENTITY_INCOMPLETE',
          message: 'Please complete your Government ID and PAN verification before submitting.',
        },
      });
      return;
    }

    // Check property document requirement (at least address proof and ownership/lease doc)
    const docs = await PropertyVerificationDocument.find({ property: property._id });
    const hasAddressProof = docs.some((d) => d.documentType === 'address_proof');
    const hasOwnershipOrLease = docs.some((d) =>
      ['ownership', 'lease_agreement', 'owner_authorization', 'noc'].includes(d.documentType)
    );

    if (!hasAddressProof || !hasOwnershipOrLease) {
      res.status(400).json({
        success: false,
        error: {
          code: 'PROPERTY_DOCS_INCOMPLETE',
          message: 'Please upload an Address Proof document and an Ownership / Authorization / Lease document.',
        },
      });
      return;
    }

    // Update Property status to PENDING_REVIEW
    property.verificationStatus = 'PENDING_REVIEW';
    property.isPublished = false; // Cannot be LIVE until admin approves
    await property.save();

    let verif = await PropertyVerification.findOne({ property: property._id });
    if (!verif) {
      verif = await PropertyVerification.create({
        property: property._id,
        host: host._id,
        isOwner: !property.isOperator,
        operatorRole: property.operatorRole || 'owner',
        status: 'pending',
      });
    } else {
      verif.status = 'pending';
      verif.rejectionReason = undefined;
      await verif.save();
    }

    res.json({
      success: true,
      data: {
        message: 'Property submitted for admin review successfully.',
        propertyStatus: property.verificationStatus,
        verificationStatus: verif.status,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
