export default function Page() {
  return (
    <div className="container-page py-20 max-w-3xl">
      <h1 className="mb-8 text-4xl font-bold">Privacy Policy</h1>
      <div className="prose prose-slate">
        <p>Last updated: {new Date().toLocaleDateString()}</p>
        <h2>1. Information We Collect</h2>
        <p>We collect information you provide directly to us, such as when you create or modify your account, request on-demand services, contact customer support, or otherwise communicate with us.</p>
        <h2>2. How We Use Information</h2>
        <p>We may use the information we collect about you to provide, maintain, and improve our services, including to process transactions, send related information, and authenticate users.</p>
        <h2>3. Information Sharing</h2>
        <p>We may share the information we collect about you with Hosts to facilitate your bookings, or with third-party vendors, consultants, and other service providers who need access to such information to carry out work on our behalf.</p>
        <h2>4. Data Security</h2>
        <p>We take reasonable measures to help protect information about you from loss, theft, misuse and unauthorized access, disclosure, alteration and destruction.</p>
      </div>
    </div>
  );
}
