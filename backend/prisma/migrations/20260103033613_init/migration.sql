-- CreateTable
CREATE TABLE `activity_logs` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `action` ENUM('CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT') NOT NULL,
    `targetType` VARCHAR(191) NOT NULL,
    `targetId` VARCHAR(191) NULL,
    `details` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `activity_logs_userId_idx`(`userId`),
    INDEX `activity_logs_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `attendance` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `checkIn` DATETIME(3) NULL,
    `checkOut` DATETIME(3) NULL,
    `totalHours` DOUBLE NULL,
    `status` ENUM('PRESENT', 'ABSENT', 'HALF_DAY') NOT NULL DEFAULT 'PRESENT',

    INDEX `attendance_userId_idx`(`userId`),
    INDEX `attendance_date_idx`(`date`),
    INDEX `attendance_status_idx`(`status`),
    UNIQUE INDEX `attendance_userId_date_key`(`userId`, `date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `employees` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `dateOfBirth` DATETIME(3) NULL,
    `gender` VARCHAR(191) NULL,
    `maritalStatus` VARCHAR(191) NULL,
    `nationality` VARCHAR(191) NULL,
    `personalEmail` VARCHAR(191) NULL,
    `mobile` VARCHAR(191) NULL,
    `address` VARCHAR(191) NULL,
    `company` VARCHAR(191) NULL,
    `manager` VARCHAR(191) NULL,
    `location` VARCHAR(191) NULL,
    `dateOfJoining` DATETIME(3) NULL,
    `empCode` VARCHAR(191) NULL,
    `bankName` VARCHAR(191) NULL,
    `accountNumber` VARCHAR(191) NULL,
    `ifscCode` VARCHAR(191) NULL,
    `panNo` VARCHAR(191) NULL,
    `uanNo` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `employees_userId_key`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `leaves` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `type` ENUM('SICK', 'CASUAL', 'ANNUAL', 'MATERNITY', 'PATERNITY') NOT NULL,
    `startDate` DATETIME(3) NOT NULL,
    `endDate` DATETIME(3) NOT NULL,
    `reason` VARCHAR(191) NOT NULL,
    `status` ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `leaves_userId_idx`(`userId`),
    INDEX `leaves_status_idx`(`status`),
    INDEX `leaves_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `payrolls` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `month` VARCHAR(191) NOT NULL,
    `year` INTEGER NOT NULL,
    `basicSalary` DOUBLE NOT NULL,
    `gross` DOUBLE NOT NULL,
    `pf` DOUBLE NOT NULL,
    `tax` DOUBLE NOT NULL,
    `deductions` DOUBLE NOT NULL,
    `netPay` DOUBLE NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `payrolls_userId_idx`(`userId`),
    INDEX `payrolls_year_month_idx`(`year`, `month`),
    UNIQUE INDEX `payrolls_userId_month_year_key`(`userId`, `month`, `year`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_requests` (
    `id` VARCHAR(191) NOT NULL,
    `requesterId` VARCHAR(191) NOT NULL,
    `type` ENUM('CREATE_USER', 'UPDATE_USER', 'DELETE_USER') NOT NULL,
    `targetUserId` VARCHAR(191) NULL,
    `data` JSON NOT NULL,
    `status` ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    `adminNote` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `user_requests_requesterId_idx`(`requesterId`),
    INDEX `user_requests_status_idx`(`status`),
    INDEX `user_requests_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_sessions` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `loginTime` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `logoutTime` DATETIME(3) NULL,
    `attendanceStatus` VARCHAR(191) NULL,
    `ipAddress` VARCHAR(191) NULL,
    `userAgent` VARCHAR(191) NULL,
    `lastActivity` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `user_sessions_userId_idx`(`userId`),
    INDEX `user_sessions_isActive_idx`(`isActive`),
    INDEX `user_sessions_loginTime_idx`(`loginTime`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `users` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `role` ENUM('ADMIN', 'EMPLOYEE', 'HR_OFFICER', 'PAYROLL_OFFICER', 'MANAGER') NOT NULL DEFAULT 'EMPLOYEE',
    `department` VARCHAR(191) NULL,
    `designation` VARCHAR(191) NULL,
    `basicSalary` DOUBLE NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `employeeId` VARCHAR(191) NULL,
    `bankName` VARCHAR(191) NULL,
    `panNo` VARCHAR(191) NULL,
    `uanNo` VARCHAR(191) NULL,
    `address` VARCHAR(191) NULL,
    `dateOfBirth` DATETIME(3) NULL,
    `gender` VARCHAR(191) NULL,
    `maritalStatus` VARCHAR(191) NULL,
    `nationality` VARCHAR(191) NULL,
    `personalEmail` VARCHAR(191) NULL,
    `mobile` VARCHAR(191) NULL,
    `company` VARCHAR(191) NULL,
    `manager` VARCHAR(191) NULL,
    `location` VARCHAR(191) NULL,
    `dateOfJoining` DATETIME(3) NULL,
    `empCode` VARCHAR(191) NULL,
    `accountNumber` VARCHAR(191) NULL,
    `ifscCode` VARCHAR(191) NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    UNIQUE INDEX `users_employeeId_key`(`employeeId`),
    INDEX `users_role_idx`(`role`),
    INDEX `users_department_idx`(`department`),
    INDEX `users_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `work_settings` (
    `id` VARCHAR(191) NOT NULL,
    `workStartTime` VARCHAR(191) NOT NULL DEFAULT '09:00',
    `workEndTime` VARCHAR(191) NOT NULL DEFAULT '17:00',
    `workingDays` VARCHAR(191) NOT NULL DEFAULT '1,2,3,4,5',
    `lunchBreakStart` VARCHAR(191) NOT NULL DEFAULT '12:00',
    `lunchBreakEnd` VARCHAR(191) NOT NULL DEFAULT '13:00',
    `checkInPopup` BOOLEAN NOT NULL DEFAULT true,
    `popupStartTime` VARCHAR(191) NOT NULL DEFAULT '08:45',
    `popupEndTime` VARCHAR(191) NOT NULL DEFAULT '09:15',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `activity_logs` ADD CONSTRAINT `activity_logs_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `attendance` ADD CONSTRAINT `attendance_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `employees` ADD CONSTRAINT `employees_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `leaves` ADD CONSTRAINT `leaves_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payrolls` ADD CONSTRAINT `payrolls_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_requests` ADD CONSTRAINT `user_requests_requesterId_fkey` FOREIGN KEY (`requesterId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_sessions` ADD CONSTRAINT `user_sessions_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
