import generateFullPath from "../utils/generateFullPath";
import getJson from "../utils/getJson";

function generateGeo( geos ) {

  let k = 0;
  let l = Math.max( geos.v.length, Math.max( geos.vn ? geos.vn.length : 0, geos.uv ? geos.uv.length : 0 ) );

  while ( k < l ) {
    if ( k < geos.v.length ) {
      geos.v[ k ] /= geos.vs;
    }
    if ( geos.uv && k < geos.uv.length ) {
      geos.uv[ k ] /= geos.us;
    }
    if ( geos.vn && k < geos.vn.length ) {
      geos.vn[ k ] /= geos.ns;
    }
    k = k + 1;
  }

  return geos.g.map( function( geo ) {
    geo.f4 = geo.f4 || { uv: [], v: [], vn: [] };
    geo.f3 = geo.f3 || { uv: [], v: [], vn: [] };

    const length = geo.f4.v.length * 3 * 1.5 + geo.f3.v.length * 3;
    const attrs = {
      normal: undefined,
      position: new Float32Array( length ),
      uv: undefined,
    };

    if ( geo.f3.vn.length || geo.f4.vn.length ) {
      attrs.normal = new Float32Array( length );
    } else {
      delete attrs.normal;
    }

    if ( geo.f3.uv.length || geo.f4.uv.length ) {
      attrs.uv = new Float32Array( length / 3 * 2 );
    } else {
      delete attrs.uv;
    }

    geo.f3.v.forEach( function( vec, i ) {
      attrs.position[ i * 3 ] = geos.v[ vec ];
      attrs.position[ i * 3 + 1 ] = geos.v[ vec + 1 ];
      attrs.position[ i * 3 + 2 ] = geos.v[ vec + 2 ];

      if ( geo.f3.uv.length ) {
        attrs.uv[ i * 2 ] = geos.uv[ geo.f3.uv[ i ] ];
        attrs.uv[ i * 2 + 1 ] = geos.uv[ geo.f3.uv[ i ] + 1 ];
      }

      if ( geo.f3.vn.length ) {
        attrs.normal[ i * 3 ] = geos.vn[ geo.f3.vn[ i ] ];
        attrs.normal[ i * 3 + 1 ] = geos.vn[ geo.f3.vn[ i ] + 1 ];
        attrs.normal[ i * 3 + 2 ] = geos.vn[ geo.f3.vn[ i ] + 2 ];
      }
    });

    for ( let N = 0; N < geo.f4.v.length / 4; N++ ) {
      for ( let n = 0, I; n < 6; n++ ) {
        switch ( n ) {
        case 0:
          I = 0;
          break;
        case 1:
          I = 1;
          break;
        case 2:
          I = 3;
          break;
        case 3:
          I = 1;
          break;
        case 4:
          I = 2;
          break;
        case 5:
          I = 3;
          break;
        }
        attrs.position[ N * 18 + n * 3 ] = geos.v[ geo.f4.v[ N * 4 + I ] ];
        attrs.position[ N * 18 + n * 3 + 1 ] = geos.v[ geo.f4.v[ N * 4 + I ] + 1 ];
        attrs.position[ N * 18 + n * 3 + 2 ] = geos.v[ geo.f4.v[ N * 4 + I ] + 2 ];

        if ( geo.f4.uv.length ) {
          attrs.uv[ N * 12 + n * 2 ] = geos.uv[ geo.f4.uv[ N * 4 + I ] ];
          attrs.uv[ N * 12 + n * 2 + 1 ] = geos.uv[ geo.f4.uv[ N * 4 + I ] + 1 ];
        }

        if ( geo.f4.vn.length ) {
          attrs.normal[ N * 18 + n * 3 ] = geos.vn[ geo.f4.vn[ N * 4 + I ] ];
          attrs.normal[ N * 18 + n * 3 + 1 ] = geos.vn[ geo.f4.vn[ N * 4 + I ] + 1 ];
          attrs.normal[ N * 18 + n * 3 + 2 ] = geos.vn[ geo.f4.vn[ N * 4 + I ] + 2 ];
        }
      }
    }

    return {
      attrs,
      type: "Buffer",
    };

  });

}

function replaceGeo( elem, geos, geoIndex ) {

  if ( elem.tag === "meshes" && elem.attrs.geos === geoIndex ) {
    elem.attrs.geos = geos;
  }
  if ( elem.children ) {
    elem.children.forEach( function( child ) {
      replaceGeo( child, geos, geoIndex );
    });
  }

  return elem;
}

function generateElement( elems, mtlArr ) {
  const elem = {
    attrs: {},
    children: null,
    tag: "",
  };

  elem.tag = elems[ 0 ];
  elem.attrs = elems[ 1 ];
  if ( elems[ 2 ] ) {
    elem.children = elems[ 2 ].map( function( child ) {
      return generateElement( child, mtlArr );
    });
  } else if ( elems[ 0 ] === "meshes" ) {
    elems[ 1 ].mtls.forEach( function( mtl, i, arr ) {
      arr[ i ] = mtlArr[ mtl ];
    });
  }

  return elem;
}

export default function( url, callback ) {

  getJson( generateFullPath( url ), function( json, url1 ) {
    const path = url1.split( "/" ).slice( 0, -1 ).join( "/" ) + "/";
    const viewData = generateElement( json.main.view, json.main.mtls );

    json.main.mtls.forEach( function( mtl ) {
      if ( mtl.value.map ) {
        mtl.value.map.src = path + mtl.value.map.src;
      }
    });

    callback({
      data: viewData,
      type: "view",
      url,
    });

    json.main.geos.forEach( function( geoUrl, i ) {
      getJson( path + geoUrl, function( geo ) {
        console.time( "AssetLoader" );
        callback({
          data: replaceGeo( viewData, generateGeo( geo ), i ),
          type: "geo",
          url,
        });

      });
    });

  });
};
