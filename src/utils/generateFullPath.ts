// 廃止予定のgetAssetとphysicsでのみ使われてるのでこれも削除してよさそう

export default function( url ) {

  if ( !/^http/.test( url ) ) {
    if ( /^\/\//.test( url ) ) {
      url = location.protocol + url;
    } else if ( /^\//.test( url ) ) {
      url = location.origin + url;
    } else {
      url = location.href.split( "/" ).slice( 0, -1 ).join( "/" ) + "/" + url;
    }
  }

  return url;

};
