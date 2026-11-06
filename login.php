<?php
require __DIR__ . '/db.php';

$input = json_decode(file_get_contents('php://input'), true);
$email = strtolower(trim($input['email'] ?? ''));
$password = $input['password'] ?? '';

if ($email === '' || $password === '') {
    json_out(['error' => 'Email and password are required'], 400);
}

$stmt = $pdo->prepare('SELECT id, email, password_hash, role FROM users WHERE email = ?');
$stmt->execute([$email]);
$user = $stmt->fetch();

if (!$user || !password_verify($password, $user['password_hash'])) {
    json_out(['error' => 'Invalid email or password'], 401);
}

session_regenerate_id(true);
$_SESSION['user_id'] = $user['id'];
$_SESSION['email'] = $user['email'];
$_SESSION['role'] = $user['role'];
json_out(['ok' => true, 'email' => $user['email'], 'role' => $user['role']]);