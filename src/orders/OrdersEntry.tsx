import {StudioContentProvider} from './StudioContent';
import {OrdersPage} from './OrdersPage';

/** Only load the design-order CMS when a visitor actually opens an order page. */
export function OrdersEntry(props:{admin?:boolean;initialNewOrder?:boolean}) {
  return <StudioContentProvider><OrdersPage {...props}/></StudioContentProvider>;
}
