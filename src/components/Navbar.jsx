import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Stethoscope, Building2, LayoutGrid } from 'lucide-react';

export default function Navbar() {
  const location = useLocation();

  const navLinks = [
    { name: 'Doctor Portal', path: '/', icon: Stethoscope },
    { name: 'Office Portal', path: '/office', icon: Building2 },
    { name: 'Admin', path: '/admin', icon: LayoutGrid },
  ];

  return (
    <header className="bg-[#1e3a8a] text-white shadow-md border-b-4 border-[#0d9488]">
      <div className="container mx-auto px-4 py-2.5 flex flex-wrap justify-between items-center gap-4">
        
        {/* Left Section: University Logo & Portal Name */}
        <div className="flex items-center space-x-3.5">
          <img 
            src="/logos/curaj-logo.png" 
            alt="CURAJ Logo" 
            className="h-12 w-auto bg-white rounded-lg p-1 shadow-sm object-contain"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
          <div>
            <h1 className="text-base md:text-lg font-bold tracking-tight text-white leading-tight">
              Health Center
            </h1>
            <p className="text-[11px] text-blue-200 font-medium">
              Central University of Rajasthan
            </p>
          </div>
        </div>

        {/* Center: Navigation Links */}
        <nav className="flex items-center space-x-1.5 md:space-x-2">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs md:text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? 'bg-white/20 text-white shadow-sm ring-1 ring-white/30'
                    : 'text-blue-100 hover:text-white hover:bg-white/10'
                }`}
              >
                <Icon size={15} />
                <span>{link.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right Section: Accreditation & Partner Logos */}
        <div className="hidden lg:flex items-center space-x-2.5 pl-3 border-l border-blue-400/30">
          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-200 mr-1">
            Accredited By
          </span>

          <img 
            src="/logos/naac.jpeg" 
            alt="NAAC A++" 
            className="h-9 w-auto bg-white rounded-md p-0.5 object-contain shadow-sm"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
          <img 
            src="/logos/nirf.jpeg" 
            alt="NIRF Ranking" 
            className="h-9 w-auto bg-white rounded-md p-0.5 object-contain shadow-sm"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
          <img 
            src="/logos/nic.png" 
            alt="NIC" 
            className="h-9 w-auto bg-white rounded-md p-0.5 object-contain shadow-sm"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        </div>

      </div>
    </header>
  );
}