import * as React from 'react';
import * as ReactDom from 'react-dom';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';
import Sof from './components/Sof';
import { ISofProps } from './components/ISofProps';
export interface ISofWebPartProps {
  description: string;
}

export default class SofWebPart extends BaseClientSideWebPart<ISofWebPartProps> {



  public render(): void {
    const element: React.ReactElement<ISofProps> = React.createElement(
      Sof,
      {
        description: this.properties.description,
        context: this.context

      }
    );

    ReactDom.render(element, this.domElement);
  }





}
