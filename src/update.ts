const updateGomlList = [];
const updateJ3List = [];
let pastTime = 0;
let delta;
let i;

(function loop( time: number ): void {
  requestAnimationFrame( loop );

  delta = time - pastTime;
  pastTime = time;

  for ( i = 0; i < updateGomlList.length; i++ ) {
    updateGomlList[ i ]( delta, time );
  }

  for ( i = 0; i < updateJ3List.length; i++ ) {
    updateJ3List[ i ]( delta, time );
  }
})( 0 );

function updateJ3( callback: () => {}, append?: boolean ): void {
  if ( append === false ) {
    const index = updateJ3List.indexOf( callback );
    if ( index !== -1 ) {
      updateJ3List.splice( index, 1 );
    }
  } else {
    updateJ3List.push( callback );
  }
}

function updateGoml( callback: () => {}, append?: boolean ): void {
  if ( append === false ) {
    const index = updateGomlList.indexOf( callback );
    if ( index !== -1 ) {
      updateGomlList.splice( index, 1 );
    }
  } else {
    updateGomlList.push( callback );
  }
}

export { updateJ3, updateGoml };
