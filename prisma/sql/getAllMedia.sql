-- @param {String} $1:name
SELECT m.* FROM media AS m WHERE m.name = $1;
