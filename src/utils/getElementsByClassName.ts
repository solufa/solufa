function find( elem, array, className, isFirstOnly ) {
  elem.childNodes.forEach( function( child ) {
    if ( !isFirstOnly || !array.length ) {
      find( child, array, className, isFirstOnly );
    }
  });

  if ( ( !isFirstOnly || !array.length ) && className === elem.className ) {
    array.push( elem );
  }
}

export default function( elem, className, isFirstOnly ) {
  const list = [];
  find( elem, list, className, isFirstOnly );
  return isFirstOnly ? ( list[ 0 ] || null ) : list;
}
