jThree( function( m ) {

  var id = 0;
  var j3 = jThree;

  function load( elem ) {
    var ctrl = this.attrs.ctrl;
    if ( ctrl.first ) {
      ctrl.first = false;
      ctrl.vps = elem;

      elem.parentNode.addEventListener( "resize", function( e ) {

        var type = e.target.canvas.width > e.target.canvas.height ? "landscape" : "portrait";

        if ( type === ctrl.type ) return;

        ctrl.type = type;
        var leftVp = this.vps.childNodes[ 0 ];
        var rightVp = this.vps.childNodes[ 1 ];

        if ( type === "landscape" ) {
          leftVp.setAttribute( "width", .5 );
          leftVp.setAttribute( "height", 1 );
          leftVp.setAttribute( "left", 0 );
          leftVp.setAttribute( "bottom", 0 );

          rightVp.setAttribute( "width", .5 );
          rightVp.setAttribute( "height", 1 );
          rightVp.setAttribute( "left", .5 );
          rightVp.setAttribute( "bottom", 0 );

          this.leftCam.style.posX = - ( this.separation || 0 );
          this.rightCam.style.posX = this.separation || 0;
          this.leftCam.style.posY = 0;
          this.rightCam.style.posY = 0;
        } else {
          leftVp.setAttribute( "width", 1 );
          leftVp.setAttribute( "height", .5 );
          leftVp.setAttribute( "left", 0 );
          leftVp.setAttribute( "bottom", .5 );

          rightVp.setAttribute( "width", 1 );
          rightVp.setAttribute( "height", .5 );
          rightVp.setAttribute( "left", 0 );
          rightVp.setAttribute( "bottom", 0 );

          this.leftCam.style.posX = 0;
          this.rightCam.style.posX = 0;
          this.leftCam.style.posY = this.separation || 0;
          this.rightCam.style.posY = - ( this.separation || 0 );
        }

        this.onchange( type );
      }.bind( ctrl ), false );
    }
  }

  var StereoVp = {
    controller: function( attrs ) {
      var mainCam = j3.document.body.querySelector( attrs.cam );
      var leftCam = j3.document.createElement( "cam" );
      leftCam.id = "stereoLeftCam" + id;
      mainCam.appendChild( leftCam );

      var rightCam = j3.document.createElement( "cam" );
      rightCam.id = "stereoRightCam" + id;
      mainCam.appendChild( rightCam );

      return {
        id: id++,
        leftCam: leftCam,
        rightCam: rightCam,
        selector: attrs.cam,
        first: true,
        type: null // landscape or portrait
      };
    },
    view: function( ctrl, attrs, child ) {
      if ( ctrl.selector !== attrs.cam ) {
        var mainCam = j3.document.body.querySelector( attrs.cam );
        mainCam.appendChild( ctrl.leftCam );
        mainCam.appendChild( ctrl.rightCam );
        ctrl.selector = attrs.cam;
      }

      ctrl.separation = attrs.separation;
      ctrl.onchange = ( attrs.onchange || function(){} ).bind( window );

      return <vps ctrl={ctrl} config={load}>
        <vp cam={"#stereoLeftCam" + ctrl.id}/>
        <vp cam={"#stereoRightCam" + ctrl.id}/>
      </vps>;
    }
  };

  window.StereoVp = StereoVp;

});
