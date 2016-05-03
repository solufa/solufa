jThree( function( m ) {

  var id = 0;
  var j3 = jThree;

  var StereoVp = {
    controller: function( attrs ) {
      var mainCam = j3.document.body.querySelector( attrs.cam );
      var leftCam = j3.document.createElement( "cam" );
      leftCam.id = "#stereoLeftCam" + id;
      mainCam.appendChild( leftCam );

      var rightCam = j3.document.createElement( "cam" );
      rightCam.id = "#stereoRightCam" + id;
      mainCam.appendChild( rightCam );
      return {
        id: id++,
        leftCam: leftCam,
        rightCam: rightCam,
        selector: attrs.cam
      };
    },
    view: function( ctrl, attrs, child ) {
      if ( ctrl.selector !== attrs.cam ) {
        var mainCam = j3.document.body.querySelector( attrs.cam );
        mainCam.appendChild( ctrl.leftCam );
        mainCam.appendChild( ctrl.rightCam );
      }

      return <vps>
        <vp cam={"#stereoLeftCam" + ctrl.id} width={.5}/>
        <vp cam={"#stereoRightCam" + ctrl.id} width={.5} left={.5}/>
      </vps>;
    }
  };

  window.StereoVp = StereoVp;

});
