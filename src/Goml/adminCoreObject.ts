const list = {};

function getGomlElement( coreObject ) {
  return list[ coreObject.id ];
}

function setCoreObject( element ) {
  if ( typeof element.coreObject.id !== "number" ) { return; }
  list[ element.coreObject.id ] = element;
}

export { getGomlElement, setCoreObject };
