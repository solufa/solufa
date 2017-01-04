import NodeList from "./NodeList";
import errorMessage from "../utils/errorMessage";

// 要するに document.createElement
export default function ( tagName, gomlDoc ) {
  let Node = NodeList[ tagName ];

  if ( !Node ) {
    errorMessage( '"' + tagName + '" element is not defined.' );
    Node = NodeList.obj;
  }

  return new Node( gomlDoc );

};
