<?php
require __DIR__ . '/auth.php';
require_login();

$input = read_input();
$action = $_GET['action'] ?? '';
$role = $_SESSION['role'];
$me = $_SESSION['email'];

// يجيب بق ويتحقق إن المستخدم يقدر يدخل مشروعه
function load_bug($pdo, $bugId) {
    $stmt = $pdo->prepare('SELECT * FROM bugs WHERE id = ?');
    $stmt->execute([$bugId]);
    $bug = $stmt->fetch();
    if (!$bug) json_out(['error' => 'Bug not found'], 404);
    if (!can_access_project($pdo, $bug['project_id'])) json_out(['error' => 'Forbidden'], 403);
    return $bug;
}

// ===== عرض بقات مشروع =====
if ($action === 'list') {
    $projectId = (int) ($_GET['project_id'] ?? 0);
    if (!can_access_project($pdo, $projectId)) json_out(['error' => 'Forbidden'], 403);

    $stmt = $pdo->prepare(
        'SELECT b.*, u.email AS assigned_email,
                (SELECT COUNT(*) FROM comments c WHERE c.bug_id = b.id) AS comments_count
         FROM bugs b
         LEFT JOIN users u ON u.id = b.assigned_to
         WHERE b.project_id = ?
         ORDER BY b.id ASC'
    );
    $stmt->execute([$projectId]);
    json_out($stmt->fetchAll());
}

// ===== تسجيل بق (manager, tester) =====
if ($action === 'create') {
    require_role(['manager', 'tester']);

    $projectId = (int) ($input['project_id'] ?? 0);
    if (!can_access_project($pdo, $projectId)) json_out(['error' => 'Forbidden'], 403);

    $severity = $input['severity'] ?? '';
    $priority = $input['priority'] ?? '';
    $status = $input['status'] ?? 'New';
    $date = $input['date'] ?? '';

    if (!in_array($severity, ['Blocker','Critical','Major','Normal','Minor','Cosmetic'], true)) json_out(['error' => 'Invalid severity'], 400);
    if (!in_array($priority, ['High','Medium','Low'], true)) json_out(['error' => 'Invalid priority'], 400);
    if (!in_array($status, ['New','Open','In Progress','Closed'], true)) json_out(['error' => 'Invalid status'], 400);
    if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) json_out(['error' => 'Invalid date'], 400);

    // المسند له لازم يكون عضو في المشروع
    $assignedId = null;
    if (!empty($input['assigned_email'])) {
        $stmt = $pdo->prepare(
            'SELECT u.id FROM users u JOIN project_members m ON m.user_id = u.id
             WHERE u.email = ? AND m.project_id = ?'
        );
        $stmt->execute([strtolower(trim($input['assigned_email'])), $projectId]);
        $u = $stmt->fetch();
        if (!$u) json_out(['error' => 'Assignee must be a project member'], 400);
        $assignedId = $u['id'];
    }

    // رقم البق التالي داخل المشروع (لا يتكرر حتى بعد الحذف)
    $stmt = $pdo->prepare('SELECT COALESCE(MAX(CAST(SUBSTRING(bug_code, 5) AS UNSIGNED)), 0) + 1 AS n FROM bugs WHERE project_id = ?');
    $stmt->execute([$projectId]);
    $code = 'Bug-' . str_pad($stmt->fetch()['n'], 2, '0', STR_PAD_LEFT);

    $stmt = $pdo->prepare(
        'INSERT INTO bugs (project_id, bug_code, date_reported, reported_by, assigned_to, severity, priority, status,
                           module, environment, description, pre_condition, steps, expected, actual, additional,
                           evidence, reproducibility)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)'
    );
    $stmt->execute([
        $projectId, $code, $date, trim($input['reported_by'] ?? ''), $assignedId, $severity, $priority, $status,
        trim($input['module'] ?? ''), trim($input['environment'] ?? ''), trim($input['description'] ?? ''),
        trim($input['pre_condition'] ?? ''), trim($input['steps'] ?? ''), trim($input['expected'] ?? ''),
        trim($input['actual'] ?? ''), trim($input['additional'] ?? ''), trim($input['evidence'] ?? ''),
        trim($input['reproducibility'] ?? '')
    ]);
    $bugId = (int) $pdo->lastInsertId();

    $pdo->prepare('INSERT INTO bug_history (bug_id, user_email, action, to_status) VALUES (?, ?, ?, ?)')
        ->execute([$bugId, $me, 'Created', $status]);

    // إشعار للمسند له
    if ($assignedId && $assignedId != $_SESSION['user_id']) {
        $pdo->prepare('INSERT INTO notifications (user_id, project_id, type, message) VALUES (?, ?, ?, ?)')
            ->execute([$assignedId, $projectId, 'assigned', 'You were assigned ' . $code]);
    }

    json_out(['ok' => true, 'id' => $bugId, 'bug_code' => $code], 201);
}

// ===== تغيير الحالة (الكل) =====
if ($action === 'status') {
    $bug = load_bug($pdo, (int) ($input['id'] ?? 0));
    $new = $input['status'] ?? '';
    if (!in_array($new, ['New','Open','In Progress','Closed'], true)) json_out(['error' => 'Invalid status'], 400);

    if ($new !== $bug['status']) {
        $pdo->prepare('UPDATE bugs SET status = ? WHERE id = ?')->execute([$new, $bug['id']]);
        $pdo->prepare('INSERT INTO bug_history (bug_id, user_email, action, from_status, to_status) VALUES (?, ?, ?, ?, ?)')
            ->execute([$bug['id'], $me, 'Status changed', $bug['status'], $new]);
    }
    json_out(['ok' => true]);
}

// ===== حذف بق (manager فقط) =====
if ($action === 'delete') {
    require_role(['manager']);
    $bug = load_bug($pdo, (int) ($input['id'] ?? 0));
    $pdo->prepare('DELETE FROM bugs WHERE id = ?')->execute([$bug['id']]);
    json_out(['ok' => true]);
}

// ===== السجل (الكل) =====
if ($action === 'history') {
    $bug = load_bug($pdo, (int) ($_GET['id'] ?? 0));
    $stmt = $pdo->prepare('SELECT user_email, action, from_status, to_status, created_at FROM bug_history WHERE bug_id = ? ORDER BY id DESC');
    $stmt->execute([$bug['id']]);
    json_out($stmt->fetchAll());
}

// ===== التعليقات (الكل) =====
if ($action === 'comments') {
    $bug = load_bug($pdo, (int) ($_GET['id'] ?? 0));
    $stmt = $pdo->prepare('SELECT user_email, text, created_at FROM comments WHERE bug_id = ? ORDER BY id ASC');
    $stmt->execute([$bug['id']]);
    json_out($stmt->fetchAll());
}

if ($action === 'add_comment') {
    $bug = load_bug($pdo, (int) ($input['id'] ?? 0));
    $text = trim($input['text'] ?? '');
    if ($text === '') json_out(['error' => 'Comment is empty'], 400);

    $pdo->prepare('INSERT INTO comments (bug_id, user_email, text) VALUES (?, ?, ?)')
        ->execute([$bug['id'], $me, $text]);

    // المنشن: @email لأعضاء المشروع فقط
    preg_match_all('/@([^\s@]+@[^\s@]+\.[^\s@]+)/', $text, $m);
    $done = [];
    foreach ($m[1] as $email) {
        $email = strtolower($email);
        if ($email === strtolower($me) || in_array($email, $done, true)) continue;

        $stmt = $pdo->prepare(
            'SELECT u.id FROM users u JOIN project_members pm ON pm.user_id = u.id
             WHERE u.email = ? AND pm.project_id = ?'
        );
        $stmt->execute([$email, $bug['project_id']]);
        $u = $stmt->fetch();
        if ($u) {
            $pdo->prepare('INSERT INTO notifications (user_id, project_id, type, message) VALUES (?, ?, ?, ?)')
                ->execute([$u['id'], $bug['project_id'], 'mention', $me . ' mentioned you in a comment on ' . $bug['bug_code']]);
            $done[] = $email;
        }
    }
    json_out(['ok' => true], 201);
}

json_out(['error' => 'Unknown action'], 400);