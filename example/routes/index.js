
/*
 * GET home page.
 */

exports.index = function(req, res){
  res.render('index', { title: 'OAuth2 example' })
};