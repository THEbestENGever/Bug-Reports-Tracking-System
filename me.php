<?php
require __DIR__ . '/db.php';

if (empty($_SESSION['user_id'])) {
    json_out(['error' => 'Not logged in'], 401);
}

json_out(['email' => $_SESSION['email'], 'role' => $_SESSION['role']]);