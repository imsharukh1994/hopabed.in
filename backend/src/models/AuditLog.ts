import { Schema, model, type HydratedDocument, type Model, Types } from 'mongoose';

export interface IAuditLog {
  actor: Types.ObjectId;
  action: 'PROPERTY_VERIFIED' | 'PROPERTY_REJECTED' | 'PROPERTY_SUSPENDED' | 'HOST_VERIFIED' | 'HOST_REJECTED' | 'SETTINGS_UPDATED';
  targetType: 'Property' | 'Host' | 'System';
  targetId?: Types.ObjectId;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export type AuditLogDocument = HydratedDocument<IAuditLog>;

const auditLogSchema = new Schema<IAuditLog>(
  {
    actor: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    action: {
      type: String,
      enum: ['PROPERTY_VERIFIED', 'PROPERTY_REJECTED', 'PROPERTY_SUSPENDED', 'HOST_VERIFIED', 'HOST_REJECTED', 'SETTINGS_UPDATED'],
      required: true,
    },
    targetType: {
      type: String,
      enum: ['Property', 'Host', 'System'],
      required: true,
    },
    targetId: { type: Schema.Types.ObjectId },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

auditLogSchema.index({ actor: 1, createdAt: -1 });
auditLogSchema.index({ targetType: 1, targetId: 1 });
auditLogSchema.index({ action: 1, createdAt: -1 });

export const AuditLog: Model<IAuditLog> = model<IAuditLog>('AuditLog', auditLogSchema);
