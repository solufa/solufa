!function() {

  var id = 0;
  var S = Solufa;
  var m = Solufa.m;

  function load( elem, isInit, ctx ) {
    var ctrl = this.attrs.ctrl;
    if ( !isInit ) {
      ctrl.vps = elem;
      ctrl.rdr = elem.parentNode;

      ctrl.resizeHandler = function( e ) {
        this.resize( e.target.canvas.width, e.target.canvas.height );
      }.bind( ctrl );

      ctrl.rdr.addEventListener( "resize", ctrl.resizeHandler, false );
    }

    ctrl.resize( elem.parentNode.canvas.width, elem.parentNode.canvas.height );

    ctx.onunload = function() {
      this.rdr.removeEventListener( "resize", this.resizeHandler, false );
    }.bind( ctrl );
  }

  var StereoVp = {
    controller: function( attrs ) {
      var mainCam = S.document.body.querySelector( attrs.cam );
      var leftCam = S.document.createElement( "cam" );
      leftCam.id = "stereoLeftCam" + id;
      mainCam.appendChild( leftCam );

      var rightCam = S.document.createElement( "cam" );
      rightCam.id = "stereoRightCam" + id;
      mainCam.appendChild( rightCam );

      return {
        id: id++,
        leftCam: leftCam,
        rightCam: rightCam,
        selector: attrs.cam,
        type: null, // landscape or portrait
        vps: null,
        resize: function( width, height ) {
          var type = width > height ? "landscape" : "portrait";

          if ( type === this.type ) return;

          this.type = type;
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
        }
      };
    },
    view: function( ctrl, attrs, child ) {
      if ( ctrl.selector !== attrs.cam ) {
        var mainCam = S.document.body.querySelector( attrs.cam );
        mainCam.appendChild( ctrl.leftCam );
        mainCam.appendChild( ctrl.rightCam );
        ctrl.selector = attrs.cam;
      }

      ctrl.separation = attrs.separation;
      ctrl.onchange = ( attrs.onchange || function(){} ).bind( window );

      // <vps ctrl={ctrl} config={load}>
      //   <vp cam={"#stereoLeftCam" + ctrl.id}/>
      //   <vp cam={"#stereoRightCam" + ctrl.id}/>
      // </vps>
      return {tag: "vps", attrs: {ctrl:ctrl, config:load}, children: [
        {tag: "vp", attrs: {cam:"#stereoLeftCam" + ctrl.id}},
        {tag: "vp", attrs: {cam:"#stereoRightCam" + ctrl.id}}
      ]};
    }
  };

  window.StereoVp = StereoVp;

}();
