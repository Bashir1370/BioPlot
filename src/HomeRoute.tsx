import { DashboardApp } from './DashboardApp';
import { HomeAccountPortal } from './HomeAccountPortal';
import { PortfolioShowcasePortal } from './PortfolioShowcase';

export function HomeRoute() {
  return <><DashboardApp/><PortfolioShowcasePortal/><HomeAccountPortal/></>;
}
