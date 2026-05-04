declare module "*.scss";
declare module "*.png";

declare module "*.jpg" {
  const value: any;
  export = value;
}

declare module "*.jpeg" {
  const value: any;
  export = value;
}

declare module "*.gif" {
  const value: any;
  export = value;
}

declare module "*.svg" {
  const value: any;
  export = value;
}

declare module "*.svg?react" {
  import React = require("react");
  const ReactComponent: React.FC<React.SVGProps<SVGSVGElement>>;
  export default ReactComponent;
}
