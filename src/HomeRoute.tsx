import { DashboardApp } from './DashboardApp';
import { HomeAccountPortal } from './HomeAccountPortal';
import { HomeProjectsMode } from './HomeProjectsMode';
import { HomeTemplatesNavigation } from './HomeTemplatesNavigation';
import { PortfolioShowcasePortal } from './PortfolioShowcase';

export function HomeRoute() {
  return <><DashboardApp/><HomeProjectsMode/><HomeTemplatesNavigation/><PortfolioShowcasePortal/><HomeAccountPortal/></>;
}
