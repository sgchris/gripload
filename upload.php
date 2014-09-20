<?php

$targetFolder = __DIR__.DIRECTORY_SEPARATOR.'uploaded-files';
$response = array();

function base64_to_jpeg($base64_string, $output_file) {
    if (($ifp = fopen($output_file, "wb")) === false) {
		throw new Exception('Cannot create image file');
	}

    $data = explode(',', $base64_string);

    if (!@fwrite($ifp, base64_decode($data[1]))) {
		throw new Exception('Cannot write data to the image file');
	}
	
    fclose($ifp); 
    return true;
}

try {

	// validate request
	if ($_SERVER['REQUEST_METHOD'] !== 'POST') 
		throw new Exception('request method is not POST');

	// check parameters
	if (!isset($_POST['chunkContent']) || 
		!isset($_POST['chunkNumber']) || 
		!isset($_POST['size']) || 
		!isset($_POST['chunkSize']) || 
		!isset($_POST['fileName']) || 
		!isset($_POST['last']) || 
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
	$token = empty($_POST['uploadToken']) || strcasecmp($_POST['uploadToken'], 'null') == 0 ? 
		uniqid('uploadToken') : $_POST['uploadToken'];

	// create file with chunk content
	$chunkFileName = $targetFolder.DIRECTORY_SEPARATOR.$token.'_'.$_POST['chunkNumber'];
	file_put_contents($chunkFileName, $_POST['chunkContent']);

	if (strcasecmp($_POST['last'], 'true') == 0) {
		$totalChunks = $_POST['chunkNumber'];
		$base64String = '';
		$targetFile = $targetFolder.DIRECTORY_SEPARATOR.$_POST['fileName'];
		for ($i = 0; $i <= $totalChunks; $i++) {
			$chunkFileName = $targetFolder.DIRECTORY_SEPARATOR.$token.'_'.$i;
			$base64String.= file_get_contents($chunkFileName);
			if (!@unlink($chunkFileName)) {
				throw new Exception('cannot delete temporary chunk file');
			}
		}
		
		base64_to_jpeg($base64String, $targetFile);
	}

	$response['result'] = 'ok';
	$response['token'] = $token;
} catch (Exception $e) {
	$response['result'] = 'error';
	$response['error'] = $e->getMessage();
}

echo json_encode($response, true);
