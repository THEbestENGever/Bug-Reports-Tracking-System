<?php
require __DIR__ . '/auth.php';
require_login();

$input = read_input();
$action = $_GET['action'] ?? '';

// ===== عرض المشاريع =====
if ($action === 'list') {
    if ($_SESSION['role'] === 'manager') {
        $stmt = $pdo->query(
            'SELECT p.id, p.name, p.status, p.created_at,
                    (SELECT COUNT(*) FROM bugs b WHERE b.project_id = p.id) AS bugs_count
             FROM projects p ORDER BY p.id DESC'
        );
    } else {
        $stmt = $pdo->prepare(
            'SELECT p.id, p.name, p.status, p.created_at,
                    (SELECT COUNT(*) FROM bugs b WHERE b.project_id = p.id) AS bugs_count
             FROM projects p
             JOIN project_members m ON m.project_id = p.id
             WHERE m.user_id = ?
             ORDER BY p.id DESC'
        );
        $stmt->execute([$_SESSION['user_id']]);
    }
    json_out($stmt->fetchAll());
}

// ===== مشروع واحد مع أعضائه =====
if ($action === 'get') {
    $id = (int) ($_GET['id'] ?? 0);
    if (!can_access_project($pdo, $id)) json_out(['error' => 'Forbidden'], 403);

    $stmt = $pdo->prepare('SELECT id, name, status, created_at FROM projects WHERE id = ?');
    $stmt->execute([$id]);
    $project = $stmt->fetch();
    if (!$project) json_out(['error' => 'Not found'], 404);

    $stmt = $pdo->prepare(
        'SELECT u.id, u.email, u.role FROM project_members m
         JOIN users u ON u.id = m.user_id WHERE m.project_id = ?'
    );
    $stmt->execute([$id]);
    $project['members'] = $stmt->fetchAll();
    json_out($project);
}

// ===== الباقي للمانجر فقط =====
require_role(['manager']);

if ($action === 'create') {
    $name = trim($input['name'] ?? '');
    if ($name === '') json_out(['error' => 'Name is required'], 400);

    $stmt = $pdo->prepare('INSERT INTO projects (name, created_by) VALUES (?, ?)');
    $stmt->execute([$name, $_SESSION['user_id']]);
    $projectId = (int) $pdo->lastInsertId();
    
foreach (($input['members'] ?? []) as $email) {
    $u = $pdo->prepare('SELECT id FROM users WHERE email = ?');
    $u->execute([strtolower(trim($email))]);
    $user = $u->fetch();
    if ($user) {
        $pdo->prepare('INSERT IGNORE INTO project_members (project_id, user_id) VALUES (?, ?)')
            ->execute([$projectId, $user['id']]);
        $pdo->prepare('INSERT INTO notifications (user_id, project_id, type, message) VALUES (?, ?, ?, ?)')
            ->execute([$user['id'], $projectId, 'added', 'You were added to project "' . $name . '"']);
    }
}
    json_out(['ok' => true, 'id' => $projectId], 201);
}

if ($action === 'delete') {
    $id = (int) ($input['id'] ?? 0);
    $pdo->prepare('DELETE FROM projects WHERE id = ?')->execute([$id]);
    json_out(['ok' => true]);
}

if ($action === 'status') {
    $id = (int) ($input['id'] ?? 0);
    $status = $input['status'] ?? '';
    if (!in_array($status, ['Active', 'Completed'], true)) json_out(['error' => 'Invalid status'], 400);
    $pdo->prepare('UPDATE projects SET status = ? WHERE id = ?')->execute([$status, $id]);
    json_out(['ok' => true]);
}

if ($action === 'add_member') {
    $pdo->prepare('INSERT IGNORE INTO project_members (project_id, user_id) VALUES (?, ?)')
        ->execute([$id, $user['id']]);

    $p = $pdo->prepare('SELECT name FROM projects WHERE id = ?');
    $p->execute([$id]);
    $pname = $p->fetch()['name'] ?? '';
    $pdo->prepare('INSERT INTO notifications (user_id, project_id, type, message) VALUES (?, ?, ?, ?)')
        ->execute([$user['id'], $id, 'added', 'You were added to project "' . $pname . '"']);
} else {
    $pdo->prepare('DELETE FROM project_members WHERE project_id = ? AND user_id = ?')
        ->execute([$id, $user['id']]);
}
json_out(['ok' => true]);


json_out(['error' => 'Unknown action'], 400);
