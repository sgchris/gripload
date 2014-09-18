<?php

$targetFolder = __DIR__.DIRECTORY_SEPARATOR.'uploaded-files';
$response = array();

try {

	// validate request
	if ($_SERVER['REQUEST_METHOD'] !== 'POST') 
		throw new Exception('request method is not POST');

	// check parameters
	if (!isset($_POST['chunkContent']) || 
		!isset($_POST['chunkNumber']) || 
		!isset($_POST['size']) || 
		!isset($_POST['chunkSize']) || 
		!isset($_POST['uploadToken']))
		throw new Exception('bad request parameters');

	// check target folder
	if (!is_dir($targetFolder)) {
		if (!@mkdir($targetFolder, 0777, true)) {
			throw new Exception('cannot create target folder');
		}
	}
	if (!is_writable($targetFolder)) {
		throw new Exception('no permissions to target folder');
	}

	// check/create token
	$token = empty($_POST['uploadToken']) || strcasecmp($_POST['uploadToken'], 'null') == 0 ? uniqid('uploadToken') : $_POST['uploadToken'];

	$response['result'] = 'ok';
	$response['token'] = $token;
} catch (Exception $e) {
	$response['result'] = 'error';
	$response['error'] = $e->getMessage();
}

echo json_encode($response, true);
