

import PageBreadcrumb from "../components/common/PageBreadCrumb";
import PageMeta from "../components/common/PageMeta";

export default function Blank() {
  return (
    <div>
      <PageMeta
          title="VipraGo | Next-Gen Talent & Workflow Orchestrator by Vipra Software Private Limited"
          description="Streamline. Simplify. Scale. – That’s VipraGo. Developed by Vipra Software Private Limited, VipraGo is a next-gen, AI-ready HRMS and workforce automation platform built with React.js and Tailwind CSS. Designed to streamline employee lifecycle, simplify payroll, leave, and attendance, and scale effortlessly across startups and enterprises."
      />

      <PageBreadcrumb pageTitle="Blank Page" />
      <div className="min-h-screen rounded-2xl border border-gray-200 bg-white px-5 py-7 dark:border-gray-800 dark:bg-white/[0.03] xl:px-10 xl:py-12">
        <div className="mx-auto w-full max-w-[630px] text-center">
          <h3 className="mb-4 font-semibold text-gray-800 text-theme-xl dark:text-white/90 sm:text-2xl">
            Card Title Here
          </h3>

          <p className="text-sm text-gray-500 dark:text-gray-400 sm:text-base">
            Start putting content on grids or panels, you can also use different
            combinations of grids.Please check out the dashboard and other pages
          </p>
        </div>
      </div>
    </div>
  );
}
