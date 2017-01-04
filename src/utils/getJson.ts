// getAssetでしか使ってないので廃止してよさそう

export default function( url: string, fn ) {

  const xhr = new XMLHttpRequest;
  xhr.open( "GET", url );
  xhr.responseType = "json";
  xhr.onreadystatechange = function() {
    if ( xhr.readyState === 4 && xhr.status === 200 ) {
      fn( xhr.response, url );
    }
  };
  xhr.send( null );
};
