/**
Simple cookie support.
@module cookie.js
@license Copyright (c) 2015 | James M. Devlin
*/

define(function() {

  return {
    getCookie: function( sName )
    {
      sName = sName.toLowerCase();
      var oCrumbles = document.cookie.split(';');
      for(var i=0; i<oCrumbles.length;i++)
      {
          var oPair= oCrumbles[i].split('=');
          var sKey = decodeURIComponent(oPair[0].trim().toLowerCase());
          var sValue = oPair.length>1?oPair[1]:'';
          if(sKey == sName)
              return decodeURIComponent(sValue);
      }
      return '';
    },

    setCookie: function( sName, sValue )
    {
      var oDate = new Date();
      oDate.setYear(oDate.getFullYear()+1);
      var sCookie = encodeURIComponent(sName) + '=' + encodeURIComponent(sValue) + ';expires=' + oDate.toGMTString() + ';path=/';
      document.cookie = sCookie;
    },

    clearCookie: function( sName )
    {
      my.setCookie(sName,'');
    }
  };

});