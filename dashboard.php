<?php
require __DIR__ . '/auth.php';
require_login();

$period = $_GET['period'] ?? 'month';

switch ($period) {
    case 'today':   $start = date('Y-m-d'); break;
    case 'month':   $start = date('Y-m-01'); break;
    case '6months': $start = date('Y-m-01', strtotime('-5 months')); break;
    case 'year':    $start = date('Y-01-01'); break;
    default: json_out(['error' => 'Invalid period'], 400);
}

// المانجر: كل المشاريع، غيره: المشاريع المضاف لها
if ($_SESSION['role'] === 'manager') {
    $scope = '1=1';
    $params = [$start];
} else {
    $scope = 'b.project_id IN (SELECT project_id FROM project_members WHERE user_id = ?)';
    $params = [$start, $_SESSION['user_id']];
}

$stmt = $pdo->prepare(
    "SELECT b.id, b.severity, b.status, b.created_at,
            (SELECT MIN(h.created_at) FROM bug_history h WHERE h.bug_id = b.id AND h.action = 'Created') AS opened_at,
            (SELECT MAX(h.created_at) FROM bug_history h WHERE h.bug_id = b.id AND h.action = 'Status changed' AND h.to_status = 'Closed') AS closed_at
     FROM bugs b
     WHERE b.date_reported >= ? AND $scope"
);
$stmt->execute($params);
$bugs = $stmt->fetchAll();

$stats = [
    'total' => count($bugs),
    'open' => 0,
    'critical' => 0,
    'resolved' => 0,
    'severity' => ['Blocker' => 0, 'Critical' => 0, 'Major' => 0, 'Normal' => 0, 'Minor' => 0, 'Cosmetic' => 0],
    'avg_days' => null,
];

$days = [];
foreach ($bugs as $b) {
    if (in_array($b['status'], ['New', 'Open', 'In Progress'], true)) $stats['open']++;
    if ($b['status'] === 'Closed') $stats['resolved']++;
    if ($b['severity'] === 'Critical') $stats['critical']++;
    $stats['severity'][$b['severity']]++;

    if ($b['status'] === 'Closed' && $b['opened_at'] && $b['closed_at']) {
        $days[] = (strtotime($b['closed_at']) - strtotime($b['opened_at'])) / 86400;
    }
}

if (count($days) > 0) {
    $stats['avg_days'] = round(array_sum($days) / count($days), 1);
}

json_out($stats);