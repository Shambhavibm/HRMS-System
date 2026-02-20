// frontend/layout/AppSidebar.jsx
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

import { useSidebar } from "../context/SidebarContext";

import {
  BoxCubeIcon,
  CalenderIcon,
  ChevronDownIcon,
  GridIcon,
  HorizontaLDots,
  ListIcon,
  PageIcon,
  PieChartIcon,
  PlugInIcon,
  TableIcon,
  UserCircleIcon,
  BriefcaseIcon,
  DollarSignIcon,
  AssetITIcon
} from "../icons";

const AppSidebar = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();

  // --- State ---
  const [role, setRole] = useState(null);
  const [userId, setUserId] = useState(null);
  const [orgId, setOrgId] = useState(null);
  const [openSubmenu, setOpenSubmenu] = useState(null);
  const [subMenuHeight, setSubMenuHeight] = useState({});
  const subMenuRefs = useRef({});

  // --- Authentication and Role Effect ---
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decoded = jwtDecode(token);
        console.log('Printing Token decoded:', decoded);

        // Destructure all necessary fields from the token
        const { role, organization_id, userId } = decoded;

        // Robust role validation (case-sensitive)
        if (!["admin", "manager", "member"].includes(role)) {
          throw new Error(`Invalid role detected: "${role}"`);
        }

        // Set all relevant state
        setRole(role);
        setUserId(userId);
        setOrgId(organization_id);
      } catch (err) {
        console.error("❌ Invalid token:", err);
        localStorage.removeItem("token");
        navigate("/signin");
      }
    } else {
      // No token found, redirect to login
      navigate("/signin");
    }
  }, [navigate]);

  // --- Menu Item Definitions with useMemo ---
  const navItems = useMemo(() => [
    {
      icon: <GridIcon />,
      name: "Dashboard",
      path:
        role === "admin"
          ? "/admin/dashboard"
          : role === "manager"
          ? "/manager/dashboard"
          : "/member/dashboard",
    },
    // ✨ NEW ASSET & IT INVENTORY MODULE ITEM ✨
    // This item will be visible to all three roles (admin, manager, member)
    // and will dynamically route to their respective views handled by AssetITInventoryPage.jsx
    {
        icon: <AssetITIcon />, // Using the new icon
        name: "IT Inventory",
        path: `/${role}/assets-inventory`, // Dynamic path based on logged-in role
    },
    // --- End NEW ASSET & IT INVENTORY MODULE ITEM ---
    ...(role === "admin"
      ? [
          {
            icon: <CalenderIcon />,
            name: "Leaves",
            subItems: [
              { name: "Leave Management", path: "/admin/leavemanagement" },
              { name: " Leave Requests", path: "/admin/leave-requests" },
            ],
          },
          {
  icon: <UserCircleIcon />,
  name: "Teams",
  subItems: [
    {
      name: "Manage Teams",
      path: "/admin/teams/manage", // ✅ tabbed layout path
    }
  ],
}
,
          {
          icon: <BoxCubeIcon />,
          name: "Projects", path: "/admin/project-management", pro: false  
        },
        {
            icon: <PieChartIcon />,
            name: "Task Management",
            subItems: [
              { name: "Project Details", path: "/admin/myproject/:projectId/assigntask"},
              // { name: "Assign Task", path: "manager/myproject/:projectId/assigntask" },
            ],
          },
          {
            icon: <PieChartIcon />,
            name: "Project Progress Report",path: "/admin/project-progress/overview" 
            // subItems: [
            //   { name: "Cost & Weekly Summary", path: "/admin/project-progress/overview" },
            //   { name: "Project Details", path: "/admin/project-progress/details" },
            //   { name: "Cost History", path: "/admin/project-progress/cost-history" },
            // ],
          },
        ]
      : []),
    ...(role === "manager"
      ? [
          {
            icon: <UserCircleIcon />,
            name: "Teams",
            subItems: [
              { name: "View My Team", path: "/manager/my-team" },
              
            ],
          },
          {
  icon: <CalenderIcon />,
  name: "Leaves",
  subItems: [
    { name: "Apply Leave", path: "/manager/apply-leave" },
    { name: "Leave Requests", path: "/manager/leave-requests" },
    { name: "Leave Analytics", path: "/manager/leave-analytics" }, // 👈 ADD THIS
    { name: "Optional Leave Booking", path: "/optional-leave-booking" } // ✅ Add this
  ],
},

          {
            icon: <PieChartIcon />,
            name: "Task Management",
            subItems: [
              { name: "Project Details", path: "/manager/view-projects"},
              // { name: "Assign Task", path: "manager/myproject/:projectId/assigntask" },
            ],
          },
           {
            icon: <PieChartIcon />, // Assuming this icon is suitable
            name: "Project Management", // NEW CATEGORY FOR MANAGER
             path: "/manager/project-progress",
           },
          // {
          //   icon: <PieChartIcon />,
          //   name: "Project Management",
          //   subItems: [
          //     { name: "Project Details", path: "/manager/project-progress/details" },
          //     { name: "View Approvals", path: "/manager/project-progress/approvals" },
          //     { name: "Approval History", path: "/manager/project-progress/history" },
          //   ],
          // },
        ]
      : []),
    ...(role === "member"
      ? [
          {
            icon: <CalenderIcon />,
            name: "Leaves",
            subItems: [
              { name: "Apply Leave", path: "/employee/apply-leave" },
               { name: "Optional Leave Booking", path: "/optional-leave-booking" } // ✅ Add this
            ],
          },
          {
            icon: <CalenderIcon />,
            name: "My Task",
            subItems: [
              { name: "My Task", path: "/member/tasks" },
            ],
          },
        ]
      : []),
    {
      icon: <CalenderIcon />,
      name: "Calendar",
      path: "/calendar",
    },
    {
      icon: <PieChartIcon />,
      name: "Project update",
      path: "/member/project-update",
    },
    {
      icon: <UserCircleIcon />,
      name: "User Profile",
      path: "/profile",
    },
    // --- Payroll Module ---
    {
      icon: <DollarSignIcon />,
      name: "Payroll",
      subItems: [
        // Common link for all roles
        { name: "Home", path: `/${role}/payroll/home` },

        // Admin-specific link for the new page
        ...(role === 'admin' ? [
          { name: "Salary Details", path: '/admin/payroll/salary-details' },
          { name: "Component Settings", path: '/admin/payroll/settings/components' }
        ] : []),

        // You can add manager/member specific links here later

        { name: "Reimbursements", path: `/${role}/reimbursements` },
      ].filter(Boolean)
    },
    // --- End Payroll Module ---
    // {
    //   name: "Forms",
    //   icon: <ListIcon />,
    //   subItems: [
    //     { name: "Form Elements", path: "/form-elements" }
    //   ],
    // },
    // {
    //   name: "Tables",
    //   icon: <TableIcon />,
    //   subItems: [
    //     { name: "Basic Tables", path: "/basic-tables" }
    //   ],
    // },
    // {
    //   name: "Pages",
    //   icon: <PageIcon />,
    //   subItems: [
    //     { name: "Blank Page", path: "/blank" },
    //     { name: "404 Error", path: "/error-404" },
    //   ],
    // },
  ], [role]);

  const othersItems = useMemo(() => [
    // {
    //   icon: <PieChartIcon />,
    //   name: "Charts",
    //   subItems: [
    //     { name: "Line Chart", path: "/line-chart" },
    //     { name: "Bar Chart", path: "/bar-chart" },
    //   ],
    // },
    // {
    //   icon: <BoxCubeIcon />,
    //   name: "UI Elements",
    //   subItems: [
    //     { name: "Alerts", path: "/alerts" },
    //     { name: "Avatar", path: "/avatars" },
    //     { name: "Badge", path: "/badge" },
    //     { name: "Buttons", path: "/buttons" },
    //     { name: "Images", path: "/images" },
    //     { name: "Videos", path: "/videos" },
    //   ],
    // },
    {
      icon: <PlugInIcon />,
      name: "Authentication",
      subItems: [
        { name: "Sign In", path: "/signin" },
        { name: "Sign Up", path: "/signup" },
      ],
    },
  ], []);

  // --- Other Effects (for submenu state) ---
  const isActive = useCallback((path) => location.pathname === path, [location.pathname]);

  useEffect(() => {
    let submenuMatched = false;
    ["main", "others"].forEach((menuType) => {
      const items = menuType === "main" ? navItems : othersItems;
      items.forEach((nav, index) => {
        if (nav.subItems) {
          nav.subItems.forEach((subItem) => {
            if (isActive(subItem.path)) {
              setOpenSubmenu({ type: menuType, index });
              submenuMatched = true;
            }
          });
        }
      });
    });
    if (!submenuMatched) setOpenSubmenu(null);
  }, [location, isActive, navItems, othersItems]);

  useEffect(() => {
    if (openSubmenu !== null) {
      const key = `${openSubmenu.type}-${openSubmenu.index}`;
      if (subMenuRefs.current[key]) {
        setSubMenuHeight((prev) => ({
          ...prev,
          [key]: subMenuRefs.current[key]?.scrollHeight || 0,
        }));
      }
    }
  }, [openSubmenu]);
  
  // --- Rendering Logic (from your working code) ---
  const handleSubmenuToggle = (index, menuType) => {
    setOpenSubmenu((prev) => {
      if (prev && prev.type === menuType && prev.index === index) return null;
      return { type: menuType, index };
    });
  };

const renderMenuItems = (items, menuType) => (
    <ul className="flex flex-col gap-4">
      {items.map((nav, index) => (
        <li key={`${menuType}-${nav.name}-${index}`}>
          {nav.subItems ? (
            <button
              onClick={() => handleSubmenuToggle(index, menuType)}
              className={`menu-item group ${openSubmenu?.type === menuType && openSubmenu?.index === index ? "menu-item-active" : "menu-item-inactive"} cursor-pointer ${!isExpanded && !isHovered ? "lg:justify-center" : "lg:justify-start"}`}
            >
              <span className={`menu-item-icon-size ${openSubmenu?.type === menuType && openSubmenu?.index === index ? "menu-item-icon-active" : "menu-item-icon-inactive"}`}>
                {nav.icon}
              </span>
              {(isExpanded || isHovered || isMobileOpen) && (
                <>
                  <span className="menu-item-text">{nav.name}</span>
                  <ChevronDownIcon className={`ml-auto w-5 h-5 transition-transform duration-200 ${openSubmenu?.type === menuType && openSubmenu?.index === index ? "rotate-180 text-brand-500" : ""}`} />
                </>
              )}
            </button>
          ) : (
            nav.path && (
              <Link to={nav.path} className={`menu-item group ${isActive(nav.path) ? "menu-item-active" : "menu-item-inactive"}`}>
                <span className={`menu-item-icon-size ${isActive(nav.path) ? "menu-item-icon-active" : "menu-item-icon-inactive"}`}>
                  {nav.icon}
                </span>
                {(isExpanded || isHovered || isMobileOpen) && (
                  <span className="menu-item-text">{nav.name}</span>
                )}
              </Link>
            )
          )}
          {nav.subItems && (isExpanded || isHovered || isMobileOpen) && (
            <div
              ref={(el) => { subMenuRefs.current[`${menuType}-${index}`] = el; }}
              className="overflow-hidden transition-all duration-300"
              style={{ height: openSubmenu?.type === menuType && openSubmenu?.index === index ? `${subMenuHeight[`${menuType}-${index}`]}px` : "0px" }}
            >
              <ul className="mt-2 space-y-1 ml-9">
                {/* ✅ THIS IS THE CORRECTED LINE 👇 */}
                {nav.subItems.map((subItem) => (
                  <li key={subItem.name}>
                    <Link to={subItem.path} className={`menu-dropdown-item ${isActive(subItem.path) ? "menu-dropdown-item-active" : "menu-dropdown-item-inactive"}`}>
                      {subItem.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </li>
      ))}
    </ul>
);

  return (
    <aside
      className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200 ${isExpanded || isMobileOpen ? "w-[290px]" : isHovered ? "w-[290px]" : "w-[90px]"} ${isMobileOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={`py-8 flex ${!isExpanded && !isHovered ? "lg:justify-center" : "justify-start"}`}>
        <Link to="/">
          {isExpanded || isHovered || isMobileOpen ? (
            <>
              <img className="dark:hidden" src="/images/logo/logo.svg" alt="Logo" width={150} height={40} />
              <img className="hidden dark:block" src="/images/logo/logo-dark.svg" alt="Logo" width={150} height={40} />
            </>
          ) : (
            <img src="/images/logo/logo-icon.svg" alt="Logo" width={32} height={32} />
          )}
        </Link>
      </div>

      <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar">
        <nav className="mb-6">
          <div className="flex flex-col gap-4">
            <div>
              <h2 className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${!isExpanded && !isHovered ? "lg:justify-center" : "justify-start"}`}>
                {isExpanded || isHovered || isMobileOpen ? "Menu" : <HorizontaLDots className="size-6" />}
              </h2>
              {renderMenuItems(navItems, "main")}
            </div>
            <div>
              <h2 className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${!isExpanded && !isHovered ? "lg:justify-center" : "justify-start"}`}>
                {isExpanded || isHovered || isMobileOpen ? "Others" : <HorizontaLDots />}
              </h2>
              {renderMenuItems(othersItems, "others")}
            </div>
          </div>
        </nav>
      </div>
    </aside>
  );
};

export default AppSidebar;