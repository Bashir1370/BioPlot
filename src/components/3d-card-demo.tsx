// BioPlot adaptation of https://ui.aceternity.com/registry/3d-card-demo.json
import type { ReactNode } from 'react';
import { CardBody, CardContainer, CardItem } from '@/components/ui/3d-card';
import './3d-card-demo.css';
export default function ThreeDCardDemo({title,description,visual,number,href,cta,rtl}: {
  title:string;description:string;visual:ReactNode;number:string;href:string;cta:string;rtl:boolean;
}) {
  return <CardContainer containerClassName="service-3d-container" className="service-3d-stage">
    <CardBody className="service-3d-body w-auto h-auto rounded-2xl border p-6">
      <CardItem translateZ={25} className="service-3d-number">{number} / 03</CardItem>
      <CardItem as="h3" translateZ={40} className="service-3d-title text-xl font-bold">{title}</CardItem>
      <CardItem as="p" translateZ={45} className="service-3d-description text-sm">{description}</CardItem>
      <CardItem translateZ={70} className="service-3d-visual w-full">{visual}</CardItem>
      <div className="service-3d-footer">
        <CardItem as="a" href={href} translateZ={30} className="home-order-service-cta">
          {cta}<span className="home-order-service-arrow" aria-hidden="true">{rtl ? '←' : '→'}</span>
        </CardItem>
      </div>
    </CardBody>
  </CardContainer>;
}
