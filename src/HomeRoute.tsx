import { DashboardApp } from './DashboardApp';
import { HomeAccountPortal } from './HomeAccountPortal';
import { HomeProjectsMode } from './HomeProjectsMode';
import { PortfolioShowcasePortal } from './PortfolioShowcase';

export function HomeRoute() {
  return <><DashboardApp/><HomeProjectsMode/><PortfolioShowcasePortal/><HomeAccountPortal/></>;
}
