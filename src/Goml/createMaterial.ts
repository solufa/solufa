import * as THREE from "three";

export default ( value ) => {

  for ( let key in value.value ) {
    if ( typeof value.value[ key ] === "object" ) {
      let tmp = value.value[ key ];
      switch ( tmp.type ) {
      case "image":
        let txr = new THREE.Texture( new Image );
        txr.image.addEventListener( "load", function() {
          this.needsUpdate = true;
        }.bind( txr ), false );

        txr.sourceFile = tmp.src;
        delete txr.image.crossOrigin; // for FireFox

        if ( !/^data:image/.test( tmp.src ) ) {
          txr.image.crossOrigin = "anonymous";
        }
        txr.image.src = tmp.src;
        value.value[ key ] = txr;
        break;

      case "canvas":
        let canvasTxr = new THREE.Texture( tmp.canvas );
        value.value[ key ] = canvasTxr;
        canvasTxr.needsUpdate = true;
        break;
      }
    }
  }

  return new THREE[ value.type + "Material" ]( value.value );
};
