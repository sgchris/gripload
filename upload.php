<?php

function receiveChunks($uploadFolder = null, $callbackFn = null) {
    $targetFolder = $uploadFolder ?: __DIR__ . '/uploads';
    $response = [];

    try {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            throw new Exception('Invalid request method. Use POST.');
        }

        if (!isset($_POST['chunkNumber'], $_POST['totalChunks'], $_POST['fileName'], $_POST['uploadToken'])) {
            throw new Exception('Missing required parameters.');
        }

        $chunkNumber = filter_var($_POST['chunkNumber'], FILTER_VALIDATE_INT);
        $totalChunks = filter_var($_POST['totalChunks'], FILTER_VALIDATE_INT);

        if ($chunkNumber === false || $totalChunks === false || $chunkNumber < 0 || $totalChunks <= 0) {
            throw new Exception('Invalid chunkNumber or totalChunks.');
        }

        $originalFileName = basename($_POST['fileName']);
        $token = preg_replace('/[^a-zA-Z0-9_-]/', '', $_POST['uploadToken']);
        $uniqueFileName = hash('sha256', $token . $originalFileName) . '-' . $originalFileName;
        $fileDir = $targetFolder . "/$uniqueFileName.parts";
        $metaFilePath = "$fileDir/meta.json";

        if (!is_dir($fileDir) && !mkdir($fileDir, 0777, true)) {
            throw new Exception('Cannot create target folder.');
        }

        if (!isset($_FILES['chunk']) || $_FILES['chunk']['error'] !== UPLOAD_ERR_OK) {
            throw new Exception('File chunk upload error.');
        }

        $chunkPath = "$fileDir/chunk_$chunkNumber";
        if (!move_uploaded_file($_FILES['chunk']['tmp_name'], $chunkPath)) {
            throw new Exception('Failed to write chunk to file.');
        }

        $metaData = file_exists($metaFilePath) ? json_decode(file_get_contents($metaFilePath), true) : [];
        $metaData['totalChunks'] = $totalChunks;
        $metaData['receivedChunks'][$chunkNumber] = true;
        file_put_contents($metaFilePath, json_encode($metaData));

        if (count($metaData['receivedChunks']) == $totalChunks) {
            $finalFilePath = $targetFolder . "/$uniqueFileName";
            $outputFile = fopen($finalFilePath, 'wb');
            
            for ($i = 0; $i < $totalChunks; $i++) {
                $chunkPath = "$fileDir/chunk_$i";
                if (!file_exists($chunkPath)) {
                    throw new Exception('Missing chunk ' . $i);
                }
                fwrite($outputFile, file_get_contents($chunkPath));
                unlink($chunkPath);
            }
            fclose($outputFile);
            rmdir($fileDir);
            unlink($metaFilePath);

            if (is_callable($callbackFn)) {
                $callbackFn($finalFilePath, $_POST);
            }
            
            $response['message'] = 'Upload complete';
            $response['file'] = $uniqueFileName;
        } else {
            $response['message'] = 'Chunk received';
            $response['chunk'] = $chunkNumber;
        }

        $response['status'] = 'success';
    } catch (Exception $e) {
        $response['status'] = 'error';
        $response['message'] = $e->getMessage();
    }

    header('Content-Type: application/json');
    echo json_encode($response);
}
