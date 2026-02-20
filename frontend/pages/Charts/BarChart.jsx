import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import BarChartOne from "../../components/charts/bar/BarChartOne";
import PageMeta from "../../components/common/PageMeta";

export default function BarChart() {
  return (
    <div>
      <PageMeta
          title="VipraGo | Next-Gen Talent & Workflow Orchestrator by Vipra Software Private Limited"
          description="Streamline. Simplify. Scale. – That’s VipraGo. Developed by Vipra Software Private Limited, VipraGo is a next-gen, AI-ready HRMS and workforce automation platform built with React.js and Tailwind CSS. Designed to streamline employee lifecycle, simplify payroll, leave, and attendance, and scale effortlessly across startups and enterprises."
      />
      <PageBreadcrumb pageTitle="Bar Chart" />
      <div className="space-y-6">
        <ComponentCard title="Bar Chart 1">
          <BarChartOne />
        </ComponentCard>
      </div>
    </div>
  );
}
