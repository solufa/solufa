!function() {

  var m = Solufa.m;

  function setUv( elem, isInit ) {
    if ( isInit ) return;

    var geometry = elem.coreObject.geometry;

    var faceVertexUvs = geometry.faceVertexUvs[ 0 ];
    for ( i = 0; i < faceVertexUvs.length; i++ ) {
      var uvs = faceVertexUvs[ i ];
      var face = geometry.faces[ i ];
      for ( var j = 0; j < 3; j ++ ) {
        var x = face.vertexNormals[ j ].x;
        var y = face.vertexNormals[ j ].y;
        var z = face.vertexNormals[ j ].z;

        if (i < faceVertexUvs.length / 2) {
          var correction = (x == 0 && z == 0) ? 1 : (Math.acos(y) / Math.sqrt(x * x + z * z)) * (2 / Math.PI);
          uvs[ j ].x = x * (428 / 1920) * correction + (480 / 1920);
          uvs[ j ].y = z * (428 / 1080) * correction + (600 / 1080);

        } else {
          var correction = ( x == 0 && z == 0) ? 1 : (Math.acos(-y) / Math.sqrt(x * x + z * z)) * (2 / Math.PI);
          uvs[ j ].x = -1 * x * (428 / 1920) * correction + (1440 / 1920);
          uvs[ j ].y = z * (428 / 1080) * correction + (600 / 1080);
        }
      }
    }
  }

  var sphereStyle = { rotate: [ 0, -Math.PI / 2, -Math.PI / 2 ] };
  var ThetaSphere = {
    controller: function() {
      return {
        geo: {
					type: "Sphere",
					value: [ 1, 64, 64 ]
        },
        mtl: {
					type: "MeshBasic",
					value: {
            map: {
              type: "video"
            },
            side: 2
          }
        }
      };
    },
    view: function( ctrl, attrs, child ) {
      ctrl.mtl.value.map.src = attrs.video;
      ctrl.mtl.value.map.needsUpdate = true;
      return <obj style={sphereStyle}><mesh geo={ ctrl.geo } mtl={ ctrl.mtl } id={attrs.id} class={attrs.class} castShadow={attrs.castShadow} receiveShadow={attrs.receiveShadow} style={attrs.style} config={setUv}>
        { child }
      </mesh></obj>;
    }
  };

  window.ThetaSphere = ThetaSphere;
}();
