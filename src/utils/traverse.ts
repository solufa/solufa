export default function traverse( element, callback, value ) {
  const newValue = callback( element, value );

  const children = element.childNodes;

  for ( let i = 0, l = children.length; i < l; i ++ ) {

    traverse( children[ i ], callback, newValue );

  }

};
