import NodeList from "./NodeList";
import errorMessage from "../utils/errorMessage";


export default function ( tagName, gomlDoc ) {
  let Node = NodeList[ tagName ];

  if ( !Node ) {
    errorMessage( '"' + tagName + '" element is not defined.' );
    Node = NodeList.obj;
  }

  return new Node( gomlDoc );

};
