import { Link } from 'react-router-dom';
import { HiOutlineShieldExclamation } from 'react-icons/hi';

const Unauthorized = () => {
  return (
    <div className="min-h-screen bg-surface-dark flex items-center justify-center p-4">
      <div className="text-center animate-fade-in">
        <div className="w-20 h-20 mx-auto rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mb-6">
          <HiOutlineShieldExclamation className="w-10 h-10 text-red-400" />
        </div>
        <h1 className="text-4xl font-bold text-slate-100 mb-3">Access Denied</h1>
        <p className="text-slate-400 text-lg mb-8 max-w-md mx-auto">
          You don't have permission to access this page. Please contact your administrator if you believe this is an error.
        </p>
        <Link
          to="/login"
          className="inline-flex items-center gap-2 px-6 py-3 gradient-indigo text-white font-semibold rounded-xl shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
        >
          Back to Login
        </Link>
      </div>
    </div>
  );
};

export default Unauthorized;
