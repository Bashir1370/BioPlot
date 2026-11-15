import {StudioContentProvider} from './StudioContent';
import {AdminStudioContent} from './AdminStudioContent';

/** Keep the CMS editor out of the public Home and request entry bundles. */
export function AdminStudioEntry() {
  return <StudioContentProvider><AdminStudioContent/></StudioContentProvider>;
}
