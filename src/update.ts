const updateGomlList = [];
const updateSList = [];
let pastTime = 0;
let delta;
let i;

(function loop( time: number ): void {
  requestAnimationFrame( loop );

  delta = time - pastTime;
  pastTime = time;

  for ( i = 0; i < updateSList.length; i++ ) {
    updateSList[ i ]( delta, time );
  }

  for ( i = 0; i < updateGomlList.length; i++ ) {
    updateGomlList[ i ]( delta, time );
  }
})( 0 );

function updateS( callback: () => {}, append?: boolean ): void {
  if ( append === false ) {
    const index = updateSList.indexOf( callback );
    if ( index !== -1 ) {
      updateSList.splice( index, 1 );
    }
  } else {
    updateSList.push( callback );
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

export { updateS, updateGoml };
