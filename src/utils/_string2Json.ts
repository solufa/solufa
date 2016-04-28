// 使わない？

import * as JSON5 from "json5";
import errorMessage from "./errorMessage";

export default ( value ) => {
  if ( typeof value === "string" ) {
    let param;
    try {
      param = JSON5.parse( value );
    } catch ( e ) {
      errorMessage( 'Format of "' + value + '" is incorrect. Please correct the format JSON5.' );
      param = {};
    }
    return param;
  } else {
    return value;
  }
};
