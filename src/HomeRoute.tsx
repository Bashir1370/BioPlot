import { DashboardApp } from './DashboardApp';
import { HomeAccountPortal } from './HomeAccountPortal';
import { HomeProjectsMode } from './HomeProjectsMode';
import { PortfolioShowcasePortal } from './PortfolioShowcase';
import { ScientificVisualHubHomePortal } from './ScientificVisualHubHome';

export function HomeRoute() {
  return <><DashboardApp/><HomeProjectsMode/><ScientificVisualHubHomePortal/><PortfolioShowcasePortal/><HomeAccountPortal/></>;
}
