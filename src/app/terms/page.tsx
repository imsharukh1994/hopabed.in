export default function Page() {
  return (
    <div className="container-page py-20 max-w-3xl">
      <h1 className="mb-8 text-4xl font-bold">Terms of Service</h1>
      <div className="prose prose-slate">
        <p>Last updated: {new Date().toLocaleDateString()}</p>
        <h2>1. Acceptance of Terms</h2>
        <p>By accessing and using Hopebed, you accept and agree to be bound by the terms and provision of this agreement.</p>
        <h2>2. Use License</h2>
        <p>Permission is granted to temporarily download one copy of the materials (information or software) on Hopebed&apos;s website for personal, non-commercial transitory viewing only.</p>
        <h2>3. Booking and Payments</h2>
        <p>All bookings made through Hopebed are subject to availability and acceptance by the Host. Payments are processed securely via our third-party payment providers.</p>
        <h2>4. User Accounts</h2>
        <p>To use certain features of the platform, you must register for an account. You agree to provide accurate, current, and complete information during the registration process.</p>
      </div>
    </div>
  );
}
