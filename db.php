<?php
ini_set('display_errors', 0);
error_reporting(E_ALL);

session_set_cookie_params([
    'httponly' => true,
    'secure'   => !empty($_SERVER['HTTPS']),
    'samesite' => 'Lax',
]);
session_start();

header('Content-Type: application/json');
header('Cache-Control: no-store');

$config = require __DIR__ . '/config.php';

try {
    $pdo = new PDO(
        'mysql:host=' . $config['host'] . ';port=' . $config['port'] . ';dbname=' . $config['dbname'] . ';charset=utf8mb4',
        $config['user'],
        $config['password'],
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]
    );
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database connection failed']);
    exit;
}

function json_out($data, $status = 200) {
    http_response_code($status);
    echo json_encode($data);
    exit;
}