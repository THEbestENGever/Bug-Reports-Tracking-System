<?php
require __DIR__ . '/auth.php';
require_login();

$action = $_GET['action'] ?? '';
$uid = $_SESSION['user_id'];

// ===== عدد غير المقروء =====
if ($action === 'count') {
    $stmt = $pdo->prepare('SELECT COUNT(*) AS n FROM notifications WHERE user_id = ? AND is_read = 0');
    $stmt->execute([$uid]);
    json_out(['count' => (int) $stmt->fetch()['n']]);
}

// ===== القائمة (الأحدث أول) =====
if ($action === 'list') {
    $stmt = $pdo->prepare(
        'SELECT id, project_id, type, message, is_read, created_at
         FROM notifications WHERE user_id = ? ORDER BY id DESC LIMIT 100'
    );
    $stmt->execute([$uid]);
    json_out($stmt->fetchAll());
}

// ===== تعليم الكل كمقروء =====
if ($action === 'mark_read') {
    $pdo->prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?')->execute([$uid]);
    json_out(['ok' => true]);
}

json_out(['error' => 'Unknown action'], 400);