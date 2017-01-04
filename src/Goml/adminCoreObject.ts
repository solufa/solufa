// GOML <=> three.js の変換管理

const list = {};

// coreObject = three.js object
function getGomlElement( coreObject ) {
  return list[ coreObject.id ];
}

// element = solufa element
function setCoreObject( element ) {
  if ( typeof element.coreObject.id !== "number" ) { return; }
  list[ element.coreObject.id ] = element;
}

export { getGomlElement, setCoreObject };
