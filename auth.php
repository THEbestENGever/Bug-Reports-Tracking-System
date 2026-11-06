<?php
require __DIR__ . '/db.php';

function require_login() {
    if (empty($_SESSION['user_id'])) {
        json_out(['error' => 'Not logged in'], 401);
    }
}

function require_role(array $roles) {
    require_login();
    if (!in_array($_SESSION['role'], $roles, true)) {
        json_out(['error' => 'Forbidden'], 403);
    }
}

function read_input() {
    return json_decode(file_get_contents('php://input'), true) ?? [];
}

// هل المستخدم الحالي عضو في المشروع (أو مانجر)؟
function can_access_project($pdo, $projectId) {
    if ($_SESSION['role'] === 'manager') return true;
    $stmt = $pdo->prepare('SELECT 1 FROM project_members WHERE project_id = ? AND user_id = ?');
    $stmt->execute([$projectId, $_SESSION['user_id']]);
    return (bool) $stmt->fetch();
}
