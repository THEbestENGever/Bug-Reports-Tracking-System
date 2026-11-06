<?php
require __DIR__ . '/auth.php';
require_role(['manager']);

$input = read_input();
$email = strtolower(trim($input['email'] ?? ''));
$password = $input['password'] ?? '';

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    json_out(['error' => 'Invalid email'], 400);
}

if (strlen($password) < 8) {
    json_out(['error' => 'Password must be at least 8 characters'], 400);
}

$stmt = $pdo->prepare('SELECT id FROM users WHERE email = ?');
$stmt->execute([$email]);
if ($stmt->fetch()) {
    json_out(['error' => 'Email already registered'], 409);
}

$hash = password_hash($password, PASSWORD_DEFAULT);

$stmt = $pdo->prepare('INSERT INTO users (email, password_hash) VALUES (?, ?)');
$stmt->execute([$email, $hash]);

json_out(['ok' => true], 201);