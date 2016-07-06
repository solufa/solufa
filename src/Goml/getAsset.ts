import generateWorker from "../utils/generateWorker";
import generateFullPath from "../utils/generateFullPath";

function workerScript() {

  function generateView( json ) {
    const view = json.view;
    return {
      data: json.data,
      view: generateElement( view ),
    };
  }

  function generateElement( view ) {
    const elem = {
      attrs: {},
      children: null,
      tag: "",
    };

    elem.tag = view[ 0 ];
    elem.attrs = view[ 1 ];
    if ( view[ 2 ] ) {
      elem.children = view[ 2 ].map( function( child ) {
        return generateElement( child );
      });
    } else if ( view[ 0 ] === "data" ) {
      elem.children = [];
    }

    return elem;
  }

  self.onmessage = function( e ) {
    const path = e.data.url.split( "/" ).slice( 0, -1 ).join( "/" ) + "/";
    const assetXhr = new XMLHttpRequest;
    assetXhr.open( "GET", e.data.url );
    assetXhr.responseType = "json";
    assetXhr.onreadystatechange = function() {
      if ( assetXhr.readyState === 4 ) {
        if ( assetXhr.status === 200 ) {
          try {
            const json = assetXhr.response;
            const viewXhr = new XMLHttpRequest;
            const mainUrl = /^http/.test( json.main ) ? json.main : path + json.main;
            viewXhr.open( "GET", mainUrl );
            viewXhr.responseType = "json";
            viewXhr.onreadystatechange = function() {
              if ( viewXhr.readyState === 4 ) {
                if ( viewXhr.status === 200 ) {
                  try {
                    self.postMessage({
                      data: generateView( viewXhr.response ),
                      index: e.data.index,
                      status: "view",
                      url: mainUrl,
                    });
                  } catch ( e ) {
                    self.postMessage({
                      data: "ajax error",
                      index: e.data.index,
                      status: "error",
                    });
                  }
                }
              }
            };
            viewXhr.send( null );
          } catch ( e ) {
            self.postMessage({
              data: "ajax error",
              index: e.data.index,
              status: "error",
            });
          }
        }
      }
    };
    assetXhr.send( null );
  };

}

function subWorkerScript() {

  function generateMesh( json, viewIndex, meshIndex ) {
    json.v.forEach( function( v, i, arr ) {
      arr[ i ] *= json.vs;
    });

    json.uv.forEach( function( v, i, arr ) {
      arr[ i ] *= json.us;
    });

    json.vn.forEach( function( v, i, arr ) {
      arr[ i ] *= json.ns;
    });

    json.f.forEach( function( face, i ) {
      const length = face.f4.v.length * 3 * 1.5 + face.f3.v.length * 3;
      const attrs = {
        normal: undefined,
        position: new Float32Array( length ),
        uv: undefined,
      };

      if ( face.f3.vn.length || face.f4.vn.length ) {
        attrs.normal = new Float32Array( length );
      } else {
        delete attrs.normal;
      }

      if ( face.f3.uv.length || face.f4.uv.length ) {
        attrs.uv = new Float32Array( length / 3 * 2 );
      } else {
        delete attrs.uv;
      }

      const mesh = {
        attrs: {
          geo: {
            attrs,
            type: "Buffer",
          },
        },
        tag: "mesh",
      };

      const result = {
        mtlIndex: face.m,
        viewIndex,
        meshIndex,
        mesh,
        status: "mesh",
      };

      face.f3.v.forEach( function( vec, ii ) {
        attrs.position[ ii * 3 ] = json.v[ vec ];
        attrs.position[ ii * 3 + 1 ] = json.v[ vec + 1 ];
        attrs.position[ ii * 3 + 2 ] = json.v[ vec + 2 ];

        if ( face.f3.uv.length ) {
          attrs.uv[ ii * 2 ] = json.uv[ face.f3.uv[ ii ] ];
          attrs.uv[ ii * 2 + 1 ] = json.uv[ face.f3.uv[ ii ] + 1 ];
        }

        if ( face.f3.vn.length ) {
          attrs.normal[ ii * 3 ] = json.vn[ face.f3.vn[ ii ] ];
          attrs.normal[ ii * 3 + 1 ] = json.vn[ face.f3.vn[ ii ] + 1 ];
          attrs.normal[ ii * 3 + 2 ] = json.vn[ face.f3.vn[ ii ] + 2 ];
        }
      });

      for ( let N = 0; N < face.f4.v.length / 4; N++ ) {
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
          attrs.position[ N * 18 + n * 3 ] = json.v[ face.f4.v[ N * 4 + I ] ];
          attrs.position[ N * 18 + n * 3 + 1 ] = json.v[ face.f4.v[ N * 4 + I ] + 1 ];
          attrs.position[ N * 18 + n * 3 + 2 ] = json.v[ face.f4.v[ N * 4 + I ] + 2 ];

          if ( face.f4.uv.length ) {
            attrs.uv[ N * 12 + n * 2 ] = json.uv[ face.f4.uv[ N * 4 + I ] ];
            attrs.uv[ N * 12 + n * 2 + 1 ] = json.uv[ face.f4.uv[ N * 4 + I ] + 1 ];
          }

          if ( face.f4.vn.length ) {
            attrs.normal[ N * 18 + n * 3 ] = json.vn[ face.f4.vn[ N * 4 + I ] ];
            attrs.normal[ N * 18 + n * 3 + 1 ] = json.vn[ face.f4.vn[ N * 4 + I ] + 1 ];
            attrs.normal[ N * 18 + n * 3 + 2 ] = json.vn[ face.f4.vn[ N * 4 + I ] + 2 ];
          }
        }
      }

      const transfar = [ attrs.position.buffer ];
      if ( attrs.uv ) {
        transfar.push( attrs.uv.buffer );
      }

      if ( attrs.normal ) {
        transfar.push( attrs.normal.buffer );
      }

      self.postMessage( result, transfar );

    });
  }

  self.onmessage = function( e ) {
    e.data.data.forEach( function( url, i ) {
      const meshXhr = new XMLHttpRequest;
      meshXhr.open( "GET", url );
      meshXhr.responseType = "json";
      meshXhr.onreadystatechange = function() {
        if ( meshXhr.readyState === 4 ) {
          if ( meshXhr.status === 200 ) {
            const json = meshXhr.response;
            const path = url.split( "/" ).slice( 0, -1 ).join( "/" ) + "/";

            json.m.forEach( function( mtl ) {
              if ( mtl.value.map ) {
                mtl.value.map.src = path + mtl.value.map.src;
              }
            });
            self.postMessage({
              index: e.data.index,
              mtls: json.m,
              status: "mtls",
            });
            generateMesh( json, e.data.index, i );
            self.postMessage({
              index: e.data.index,
              status: "final",
            });

          }
        }
      };
      meshXhr.send( null );
    });
  };
}

let worker;
let subWorker;
const viewList = [];
const mtls = [];

export default {
  add: function( url, index ) {

    worker.postMessage({
      index: index,
      url: generateFullPath( url ),
    });
  },
  init: function( fn ) {

    worker = generateWorker( workerScript );
    subWorker = generateWorker( subWorkerScript );

    function replaceMesh( elem, mesh, meshIndex ) {
      if ( elem.tag === "data" && elem.attrs.mesh === "$" + meshIndex ) {
        elem.children.push( mesh );
      }
      if ( elem.children ) {
        elem.children.forEach( function( child ) {
          replaceMesh( child, mesh, meshIndex );
        });
      }
    }

    worker.onmessage = function( e ) {
      const viewData = e.data.data;
      viewList[ e.data.index ] = e.data.data = viewData.view;
      this( e.data );
      const path = e.data.url.split( "/" ).slice( 0, -1 ).join( "/" ) + "/";
      subWorker.postMessage({
        data: viewData.data.map( function( url ) {
          return path + url;
        }),
        index: e.data.index,
      });
    }.bind( fn );

    subWorker.onmessage = function( e ) {
      switch ( e.data.status ) {
      case "mesh":
        e.data.mesh.attrs.mtl = mtls[ e.data.viewIndex ][ e.data.mtlIndex ];
        replaceMesh( viewList[ e.data.viewIndex ], e.data.mesh, e.data.meshIndex );
        this({
          data: viewList[ e.data.viewIndex ],
          index: e.data.viewIndex,
          status: "mesh",
        });
        break;
      case "mtls":
        mtls[ e.data.index ] = e.data.mtls;
        break;
      case "final":
        viewList[ e.data.index ] = null;
        this( e.data );
        break;
      }

    }.bind( fn );
  },
};
