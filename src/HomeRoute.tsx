import { DashboardApp } from './DashboardApp';
import { HomeAccountPortal } from './HomeAccountPortal';
import { HomeTemplatesNavigation } from './HomeTemplatesNavigation';
import { PortfolioShowcasePortal } from './PortfolioShowcase';

export function HomeRoute() {
  return <><DashboardApp/><HomeTemplatesNavigation/><PortfolioShowcasePortal/><HomeAccountPortal/></>;
}
