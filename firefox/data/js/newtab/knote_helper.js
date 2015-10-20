'use strict';

(function(window, $) {

window.KnoteHelper = {
  // This function will get the title for
  // displaying on right side, Not for storing on db
  getTitleFromContent: function(content){
    var title, temp;
    if(content.length < 1) return 'Untitled';
    var contents = $('<div>').append(content).contents();
    title = $('<div>').append(contents[0]).text().trim();

    if(title.length < 1){
      // If there is no title than use body's first few letters
      title = $('<div>').append(content).text().trim();
      if(title.length < 1) title = 'Untitled';
    }

    // If title has newline or carriage return,
    // Use only first line as a title
    temp = title.search(/[\n\r]/);
    if(temp > -1 ){
      title = title.slice(0, temp)
    }

    return title.length < 25 ? title : title.substr(0, 23) + '...' ;
  },



  getTitleForUI: function (self) {
    var title;
    if(typeof self.attributes.type != 'undefined' && self.attributes.type == 'checklist' ){
      title = self.attributes.title;
      if(typeof title == 'undefined') title = 'Untitled'
      return title.length < 25 ? title : title.substr(0, 23) + '...' ;
    }else{
      if(typeof self.attributes.content == 'undefined') return "Untitled";
      return this.getTitleFromContent(self.attributes.content);
    }

  },



  getUpdateOptions: function($ele){
    var data = {};
    var body = '';
    var title, temp;
    var contents = $ele.contents();
    var $tempEle = $('<div>');
    var titleLimit = 150;

    title = $tempEle.append($(contents[0]).clone()).html().trim();

    // If title has newline or carriage return,
    // Use only first line as a title,
    // Prepend rest of the text to body
    temp = title.search(/[\n\r]/);
    if(temp > -1){
      body  = title.slice(temp + 1);
      title = title.slice(0, temp);
    }

    // If title is more than 150 char,
    // Use only first 150 char as title,
    // Prepend rest to the body
    if(title.length > titleLimit){
      body  = title.slice(titleLimit) + body;
      title = title.slice(0, titleLimit);
    }

    if (contents.length  > 1){
      $tempEle.html('');
      for(var i = 1; i<contents.length; i++){
        if(!$(contents[i]).hasClass('split-body-br')){
          $tempEle.append($(contents[i]).clone());
        }
      }
      body += $tempEle.html().trim();
    }
    data.title = title;
    data.htmlBody = body;
    return data;
  },



  setCursorOnContentEditable : function($ele){
    var range, sel, textRange;
    $ele.focus();
    if( (typeof(window.getSelection) != "undefined") && (typeof(document.createRange) != "undefined")){
      // IE 9 and non-IE
      range = document.createRange();
      range.selectNodeContents($ele);
      range.collapse(false);
      sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
    }
    else{
      if (typeof document.body.createTextRange != "undefined"){
        // IE < 9
        textRange = document.body.createTextRange();
        textRange.moveToElementText($ele);
        textRange.collapse(false);
        textRange.select();
      }
    }
    return false;
  }



};

})(window, jQuery);
