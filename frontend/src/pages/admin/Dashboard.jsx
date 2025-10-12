const AdminDashboard = () => {
  return (
    <div className="space-y-6">
      <div className="card">
        <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
        <p className="text-gray-600">System statistics and overview.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="card">
          <h3 className="font-semibold mb-2">Total Locations</h3>
          <p className="text-3xl font-bold text-primary-600">--</p>
        </div>
        <div className="card">
          <h3 className="font-semibold mb-2">Total Hotels</h3>
          <p className="text-3xl font-bold text-green-600">--</p>
        </div>
        <div className="card">
          <h3 className="font-semibold mb-2">Pending Approvals</h3>
          <p className="text-3xl font-bold text-orange-600">--</p>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
